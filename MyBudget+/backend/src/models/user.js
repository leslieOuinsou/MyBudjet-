import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    index: true
  },
  password: {
    type: String,
    minlength: [12, 'Password must be at least 12 characters']
  },
  googleId: { 
    type: String, 
    sparse: true,
    index: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  role: { 
    type: String, 
    enum: {
      values: ['user', 'admin'],
      message: 'Role must be either user or admin'
    }, 
    default: 'user' 
  },
  blocked: { 
    type: Boolean, 
    default: false 
  },
  profilePicture: String,
  phoneNumber: String,
  preferences: {
    currency: { type: String, default: 'EUR' },
    language: { type: String, default: 'fr' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true
});

// Additional indexes (email and googleId already indexed in schema)
userSchema.index({ createdAt: -1 });

// Virtual for full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    profilePicture: this.profilePicture,
    emailVerified: this.emailVerified
  };
});

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Don't return password and sensitive fields by default
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.verificationToken;
    delete ret.verificationTokenExpires;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('User', userSchema);
