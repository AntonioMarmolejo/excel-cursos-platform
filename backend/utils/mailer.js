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

// CLIENT_URL puede traer varios orígenes separados por coma (CORS):
// los enlaces de los correos usan el primero, que debe ser el dominio principal
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

const baseTemplate = (content) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #1a7f5a;">eccursos</h2>
    ${content}
    <hr style="border: 1px solid #eee; margin-top: 32px;"/>
    <p style="color: #888; font-size: 12px;">Si no solicitaste esto, puedes ignorar este correo.</p>
  </div>
`;

exports.sendVerificationEmail = async (email, name, token) => {
  const url = `${CLIENT_URL}/verificar/${token}`;
  await transporter.sendMail({
    from: `"eccursos" <${process.env.SMTP_USER}>`,
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
  const url = `${CLIENT_URL}/reset-password/${token}`;
  await transporter.sendMail({
    from: `"eccursos" <${process.env.SMTP_USER}>`,
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

const escapeHtml = (str = '') =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

exports.sendInstructorDecisionEmail = async (email, name, approved, reason) => {
  const url = `${CLIENT_URL}/instructor`;
  await transporter.sendMail({
    from: `"eccursos" <${process.env.SMTP_USER}>`,
    to: email,
    subject: approved ? '¡Ya eres instructor!' : 'Sobre tu solicitud de instructor',
    html: baseTemplate(approved ? `
      <p>Hola <strong>${escapeHtml(name)}</strong>,</p>
      <p>Tu solicitud fue aprobada. Ya puedes crear y publicar tus cursos:</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#1a7f5a;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
        Ir a mi panel de instructor
      </a>
    ` : `
      <p>Hola <strong>${escapeHtml(name)}</strong>,</p>
      <p>Por ahora no pudimos aprobar tu solicitud de instructor.</p>
      ${reason ? `<p><strong>Motivo:</strong> ${escapeHtml(reason)}</p>` : ''}
      <p>Puedes corregirla y volver a enviarla cuando quieras.</p>
    `),
  });
};

exports.sendCourseReviewEmail = async (email, name, courseTitle, approved, reason) => {
  await transporter.sendMail({
    from: `"eccursos" <${process.env.SMTP_USER}>`,
    to: email,
    subject: approved ? `Tu curso "${courseTitle}" fue publicado` : `Tu curso "${courseTitle}" necesita cambios`,
    html: baseTemplate(approved ? `
      <p>Hola <strong>${escapeHtml(name)}</strong>,</p>
      <p>Tu curso <strong>${escapeHtml(courseTitle)}</strong> fue aprobado y ya aparece en el catálogo.</p>
    ` : `
      <p>Hola <strong>${escapeHtml(name)}</strong>,</p>
      <p>Revisamos tu curso <strong>${escapeHtml(courseTitle)}</strong> y necesita algunos cambios antes de publicarse.</p>
      ${reason ? `<p><strong>Comentarios:</strong> ${escapeHtml(reason)}</p>` : ''}
      <p>Cuando lo corrijas, envíalo de nuevo a revisión desde tu panel.</p>
    `),
  });
};
