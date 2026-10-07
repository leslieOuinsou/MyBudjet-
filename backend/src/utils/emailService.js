import nodemailer from 'nodemailer';

// Configuration du transporteur email
const createTransporter = () => {
  // Vérifier si les variables d'environnement sont configurées
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Variables EMAIL_USER et EMAIL_PASS non configurées. Les emails ne seront pas envoyés.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail', // ou 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password pour Gmail
    },
  });
};

// Envoyer un email de réinitialisation de mot de passe
export const sendPasswordResetEmail = async (email, resetToken, from = null) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('📧 Mode développement : Email non envoyé');
    return { success: false, reason: 'Email not configured' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const fromParam = from ? `?from=${from}` : '';
  const resetLink = `${frontendUrl}/reset-password/${resetToken}${fromParam}`;

  console.log(`📧 Préparation email pour ${email}`);
  console.log(`🔗 Lien de réinitialisation: ${resetLink}`);

  const mailOptions = {
    from: `"MyBudget+" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe - MyBudget+',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 40px 30px;
            color: #333;
          }
          .content p {
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            padding: 14px 40px;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .button:hover {
            opacity: 0.9;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
          }
          .divider {
            border-top: 1px solid #e9ecef;
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 MyBudget+</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Réinitialisation de mot de passe</p>
          </div>
          
          <div class="content">
            <p>Bonjour,</p>
            
            <p>Nous avons reçu une demande de réinitialisation de votre mot de passe pour votre compte <strong>MyBudget+</strong>.</p>
            
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
              Ou copiez ce lien dans votre navigateur :<br>
              <span style="word-break: break-all; color: #667eea;">${resetLink}</span>
            </p>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Ce lien est valide pendant <strong>1 heure</strong></li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Ne partagez jamais ce lien avec personne</li>
              </ul>
            </div>
            
            <div class="divider"></div>
            
            <p style="color: #6c757d; font-size: 13px; margin-top: 30px;">
              Si vous avez des questions, contactez notre support à <a href="mailto:support@mybudget.com" style="color: #667eea;">support@mybudget.com</a>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© 2025 MyBudget+ - Tous droits réservés</p>
            <p style="margin: 0; color: #adb5bd;">
              Vous recevez cet email car une demande de réinitialisation a été effectuée sur votre compte.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de réinitialisation envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
};

// Envoyer un email de confirmation après réinitialisation
export const sendPasswordChangedEmail = async (email, userName) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('📧 Mode développement : Email non envoyé');
    return { success: false, reason: 'Email not configured' };
  }

  const mailOptions = {
    from: `"MyBudget+" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Votre mot de passe a été modifié - MyBudget+',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 40px 30px; color: #333; }
          .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ MyBudget+</h1>
            <p style="margin: 10px 0 0 0;">Mot de passe modifié</p>
          </div>
          
          <div class="content">
            <p>Bonjour ${userName},</p>
            
            <p>Nous vous confirmons que votre mot de passe <strong>MyBudget+</strong> a été modifié avec succès.</p>
            
            <p><strong>Détails de la modification :</strong></p>
            <ul>
              <li>Date : ${new Date().toLocaleString('fr-FR')}</li>
              <li>Adresse IP : [À implémenter si besoin]</li>
            </ul>
            
            <p style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
              <strong>⚠️ Vous n'êtes pas à l'origine de ce changement ?</strong><br>
              Contactez immédiatement notre support à <a href="mailto:support@mybudget.com">support@mybudget.com</a>
            </p>
            
            <p style="color: #6c757d; font-size: 13px; margin-top: 30px;">
              Pour toute question, notre équipe est à votre disposition.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">© 2025 MyBudget+ - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmation envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
};

// Code de double authentification (connexion ou activation)
export const sendTwoFactorCodeEmail = async (email, userName, code, purpose = 'login') => {
  const transporter = createTransporter();
  if (!transporter) return { success: false, reason: 'Email not configured' };

  const action = purpose === 'enable' ? 'activer la double authentification' : 'vous connecter';
  try {
    const info = await transporter.sendMail({
      from: `"MyBudget+" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Votre code de sécurité MyBudget+ : ${code}`,
      html: `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#1E73BE">Code de sécurité</h2>
        <p>Bonjour ${userName || ''},</p>
        <p>Voici votre code pour ${action} :</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:24px 0">${code}</p>
        <p style="color:#6C757D;font-size:13px">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, changez votre mot de passe.</p>
      </div>`,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi code 2FA:', error.message);
    return { success: false, error: error.message };
  }
};

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Copie e-mail d'une notification de l'application
export const sendNotificationEmail = async (email, userName, { title, message, priority = 'medium' }) => {
  const transporter = createTransporter();
  if (!transporter) return { success: false, reason: 'Email not configured' };

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const accent = priority === 'high' ? '#DC3545' : '#1E73BE';
  try {
    const info = await transporter.sendMail({
      from: `"MyBudget+" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${title} - MyBudget+`,
      html: `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #E9EEF5;border-radius:12px;overflow:hidden">
        <div style="background:${accent};color:#fff;padding:18px 24px;font-size:18px;font-weight:700">MyBudget+</div>
        <div style="padding:24px;color:#22292F">
          <p style="margin:0 0 4px">Bonjour ${esc(userName)},</p>
          <h2 style="margin:12px 0 8px;font-size:18px">${esc(title)}</h2>
          <p style="line-height:1.6;margin:0 0 20px">${esc(message)}</p>
          <a href="${frontendUrl}/notifications" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600">Voir mes notifications</a>
        </div>
        <div style="padding:14px 24px;background:#F5F7FA;color:#6C757D;font-size:12px">Vous recevez cet e-mail car les notifications par e-mail sont activées. Vous pouvez les désactiver dans Mon profil > Préférences.</div>
      </div>`,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi notification e-mail:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendNotificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendTwoFactorCodeEmail,
};
