import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import GoogleStrategy from 'passport-google-oauth20';
import prisma from '../lib/prisma.js';
import { serialize } from '../lib/serialize.js';

// Vérifier que JWT_SECRET est configuré
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET non configurée dans les variables d\'environnement');
  process.exit(1);
}

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
}, async (jwt_payload, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: jwt_payload.id } });
    if (user && !user.blocked) return done(null, serialize(user));
    return done(null, false);
  } catch (err) {
    return done(err, false);
  }
}));

// Google OAuth Strategy (optional - only if credentials are configured)
console.log('🔑 Vérification des variables Google OAuth:', {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Défini' : 'Non défini',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Défini' : 'Non défini',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ Configuration Google OAuth activée');
  
  // Construire l'URL de callback complète
  let callbackURL = process.env.GOOGLE_CALLBACK_URL;
  if (!callbackURL) {
    // Si pas défini, construire depuis l'environnement
    if (process.env.VERCEL_URL) {
      callbackURL = `https://${process.env.VERCEL_URL}/api/auth/google/callback`;
    } else {
      callbackURL = '/api/auth/google/callback';
    }
  }
  
  console.log('🔗 Google OAuth Callback URL:', callbackURL);
  
  passport.use(new GoogleStrategy.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔍 Google profile received:', {
        id: profile.id,
        displayName: profile.displayName,
        emails: profile.emails,
        name: profile.name
      });

      let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
      if (!user) {
        // Get email from profile
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        if (!email) {
          console.error('❌ No email provided by Google');
          return done(new Error('No email provided by Google'), false);
        }

        // Get name from profile (with multiple fallbacks)
        let name = 'Google User'; // Default fallback
        if (profile.displayName && profile.displayName.trim()) {
          name = profile.displayName.trim();
        } else if (profile.name && profile.name.givenName && profile.name.givenName.trim()) {
          name = profile.name.givenName.trim();
        } else if (profile.name && (profile.name.givenName || profile.name.familyName)) {
          const givenName = profile.name.givenName || '';
          const familyName = profile.name.familyName || '';
          const fullName = `${givenName} ${familyName}`.trim();
          if (fullName) {
            name = fullName;
          }
        } else if (email && email.split('@')[0].trim()) {
          name = email.split('@')[0].trim();
        }

        console.log('✅ Extracted name:', name);

        // Check if user exists with same email
        user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          console.log('🔗 Linking Google account to existing user');
          const updateData = {
            googleId: profile.id,
            emailVerified: true,
          };
          if (!user.name || user.name.trim() === '') {
            updateData.name = name;
          }
          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        } else {
          console.log('🆕 Creating new user with Google account');
          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              email,
              name,
              emailVerified: true,
            },
          });
          console.log('✅ User created:', user.id);
        }
      }
      return done(null, serialize(user));
    } catch (err) {
      console.error('❌ Google OAuth error:', err);
      return done(err, false);
    }
  }));
  console.log('✅ Google OAuth configured');
} else {
  console.log('⚠️  Google OAuth not configured (optional)');
}

passport.serializeUser((user, done) => {
  done(null, user.id || user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user ? serialize(user) : null);
  } catch (err) {
    done(err, null);
  }
});
