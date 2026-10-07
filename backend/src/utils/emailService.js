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
            background-color: #F1F5F9;
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
            background: linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%);
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
            background: linear-gradient(135deg, #2563EB 0%, #1E3A8A 100%);
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
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            background-color: #F8FAFC;
            padding: 20px 30px;
            text-align: center;
            color: #64748B;
            font-size: 12px;
          }
          .divider {
            border-top: 1px solid #E2E8F0;
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
            
            <p style="color: #64748B; font-size: 14px; margin-top: 30px;">
              Ou copiez ce lien dans votre navigateur :<br>
              <span style="word-break: break-all; color: #2563EB;">${resetLink}</span>
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
            
            <p style="color: #64748B; font-size: 13px; margin-top: 30px;">
              Si vous avez des questions, contactez notre support à <a href="mailto:support@mybudget.com" style="color: #2563EB;">support@mybudget.com</a>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© 2025 MyBudget+ - Tous droits réservés</p>
            <p style="margin: 0; color: #94A3B8;">
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
          body { font-family: Arial, sans-serif; background-color: #F1F5F9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #16A34A 0%, #059669 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 40px 30px; color: #333; }
          .footer { background-color: #F8FAFC; padding: 20px 30px; text-align: center; color: #64748B; font-size: 12px; }
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
            
            <p style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 4px;">
              <strong>⚠️ Vous n'êtes pas à l'origine de ce changement ?</strong><br>
              Contactez immédiatement notre support à <a href="mailto:support@mybudget.com">support@mybudget.com</a>
            </p>
            
            <p style="color: #64748B; font-size: 13px; margin-top: 30px;">
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
        <h2 style="color:#2563EB">Code de sécurité</h2>
        <p>Bonjour ${userName || ''},</p>
        <p>Voici votre code pour ${action} :</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:24px 0">${code}</p>
        <p style="color:#64748B;font-size:13px">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, changez votre mot de passe.</p>
      </div>`,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi code 2FA:', error.message);
    return { success: false, error: error.message };
  }
};

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const TYPE_STYLES = {
  budget_alert: { icon: '⚠️', label: 'Alerte budget', color: '#F59E0B' },
  budget_exceeded: { icon: '🚨', label: 'Budget dépassé', color: '#DC2626' },
  bill: { icon: '🧾', label: 'Rappel de facture', color: '#16A34A' },
  goal_achieved: { icon: '🏆', label: 'Objectif atteint', color: '#16A34A' },
  document: { icon: '📄', label: 'Document à renouveler', color: '#F59E0B' },
  weekly: { icon: '📊', label: 'Résumé hebdomadaire', color: '#3B82F6' },
  security: { icon: '🔒', label: 'Sécurité', color: '#EAB308' },
  system: { icon: '🔔', label: 'Notification', color: '#2563EB' },
};

// Copie e-mail d'une notification de l'application (mise en page à tableaux : compatible Gmail, Outlook, mobile)
export const sendNotificationEmail = async (email, userName, { title, message, priority = 'medium', type = 'system' }) => {
  const transporter = createTransporter();
  if (!transporter) return { success: false, reason: 'Email not configured' };

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const style = TYPE_STYLES[type] || TYPE_STYLES.system;
  const firstName = esc(String(userName || '').split(' ')[0]);
  const urgent = priority === 'high' || type === 'budget_exceeded';
  try {
    const info = await transporter.sendMail({
      from: `"MyBudget+" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${style.icon} ${title} - MyBudget+`,
      html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 12px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="background:linear-gradient(135deg,#2563EB,#6C5CE7);background-color:#2563EB;border-radius:16px 16px 0 0;padding:26px 32px">
      <div style="color:#fff;font-size:22px;font-weight:800;letter-spacing:.3px">MyBudget+</div>
      <div style="color:rgba(255,255,255,.85);font-size:13px;margin-top:2px">Votre gestion financière, simplement</div>
    </td></tr>
    <tr><td style="background:#fff;padding:32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0">
      <p style="margin:0 0 18px;color:#64748B;font-size:15px">Bonjour ${firstName || 'et bienvenue'},</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-left:5px solid ${style.color};border-radius:12px;background:#FAFBFD">
        <tr><td style="padding:20px 22px">
          <div style="font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:${style.color}">${style.icon}&nbsp; ${style.label}${urgent ? ' · Urgent' : ''}</div>
          <div style="font-size:19px;font-weight:700;color:#0F172A;margin:8px 0 6px">${esc(title)}</div>
          <div style="font-size:15px;line-height:1.6;color:#334155">${esc(message)}</div>
        </td></tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 4px"><tr>
        <td style="background:#2563EB;border-radius:10px"><a href="${frontendUrl}/notifications" style="display:inline-block;padding:13px 28px;color:#fff;text-decoration:none;font-weight:700;font-size:15px">Voir mes notifications</a></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#EEF2F7;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 16px 16px;padding:18px 32px;color:#64748B;font-size:12px;line-height:1.6;text-align:center">
      Vous recevez cet e-mail car les notifications par e-mail sont activées.<br>
      Pour les arrêter : <a href="${frontendUrl}/notifications" style="color:#2563EB">Notifications</a> › « Recevoir aussi par e-mail ».<br>
      © MyBudget+
    </td></tr>
  </table>
</td></tr></table></body></html>`,
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
