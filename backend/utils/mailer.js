const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const baseTemplate = (content) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #1a7f5a;">Cursos de Excel</h2>
    ${content}
    <hr style="border: 1px solid #eee; margin-top: 32px;"/>
    <p style="color: #888; font-size: 12px;">Si no solicitaste esto, puedes ignorar este correo.</p>
  </div>
`;

exports.sendVerificationEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/verificar/${token}`;
  await transporter.sendMail({
    from: `"Cursos Excel" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verifica tu cuenta',
    html: baseTemplate(`
      <p>Hola <strong>${name}</strong>,</p>
      <p>Gracias por registrarte. Haz clic en el botón para verificar tu cuenta:</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#1a7f5a;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
        Verificar cuenta
      </a>
      <p>O copia este enlace: <code>${url}</code></p>
    `),
  });
};

exports.sendPasswordResetEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await transporter.sendMail({
    from: `"Cursos Excel" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Restablecer contraseña',
    html: baseTemplate(`
      <p>Hola <strong>${name}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña:</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#1a7f5a;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
        Restablecer contraseña
      </a>
      <p>Este enlace expira en 1 hora.</p>
    `),
  });
};
