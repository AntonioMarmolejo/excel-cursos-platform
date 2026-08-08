import '../styles/Certificate.css';

const fmtDate = (d) => new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });

// Construye un documento HTML autocontenido (estilos inline) para imprimir/guardar como PDF
// desde una ventana aparte, sin depender de ninguna librería de generación de PDF.
function buildPrintHtml({ studentName, courseTitle, completedAt }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Certificado - ${courseTitle}</title>
<style>
  @page { size: landscape; margin: 0; }
  body {
    margin: 0; padding: 48px; font-family: Georgia, 'Times New Roman', serif;
    background: #0f0f0f; color: #f0f0f0; display: flex; align-items: center; justify-content: center;
    min-height: 100vh; box-sizing: border-box;
  }
  .cert {
    width: 100%; max-width: 900px; padding: 56px 64px; text-align: center;
    border: 3px solid #22c55e; border-radius: 4px; position: relative;
  }
  .cert::before {
    content: ''; position: absolute; inset: 12px; border: 1px solid rgba(34,197,94,0.4);
  }
  .brand { font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #22c55e; margin-bottom: 32px; font-family: Arial, sans-serif; }
  .title { font-size: 32px; font-weight: bold; margin: 0 0 8px; }
  .subtitle { font-size: 14px; color: #9a9a9a; margin: 0 0 40px; font-family: Arial, sans-serif; }
  .student { font-size: 30px; color: #4ade80; margin: 0 0 8px; font-style: italic; }
  .line { width: 220px; height: 1px; background: #2a2a2a; margin: 8px auto 24px; }
  .desc { font-size: 15px; color: #d4d4d4; line-height: 1.7; max-width: 560px; margin: 0 auto 32px; font-family: Arial, sans-serif; }
  .course { color: #f0f0f0; font-weight: bold; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; font-family: Arial, sans-serif; }
  .date { font-size: 13px; color: #9a9a9a; text-align: left; }
  .seal { width: 70px; height: 70px; border-radius: 50%; background: #22c55e; color: #000;
    display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto; }
</style>
</head>
<body>
  <div class="cert">
    <div class="brand">Cursos de Excel</div>
    <p class="title">Certificado de Finalización</p>
    <p class="subtitle">Se certifica que</p>
    <p class="student">${studentName}</p>
    <div class="line"></div>
    <p class="desc">Ha completado satisfactoriamente el curso <span class="course">${courseTitle}</span>, cumpliendo con la totalidad del contenido del programa.</p>
    <div class="footer">
      <div class="date">Fecha de finalización<br/><strong>${fmtDate(completedAt)}</strong></div>
      <div class="seal">✓</div>
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

export default function Certificate({ studentName, courseTitle, completedAt }) {
  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return; // bloqueado por el navegador
    w.document.write(buildPrintHtml({ studentName, courseTitle, completedAt }));
    w.document.close();
  };

  return (
    <div className="certificate">
      <div className="certificate__border">
        <div className="certificate__brand">Cursos de Excel</div>
        <p className="certificate__title">Certificado de Finalización</p>
        <p className="certificate__subtitle">Se certifica que</p>
        <p className="certificate__student">{studentName}</p>
        <div className="certificate__line" />
        <p className="certificate__desc">
          Ha completado satisfactoriamente el curso <strong>{courseTitle}</strong>, cumpliendo con la totalidad del contenido del programa.
        </p>
        <div className="certificate__footer">
          <div className="certificate__date">
            Fecha de finalización<br />
            <strong>{fmtDate(completedAt)}</strong>
          </div>
          <div className="certificate__seal">✓</div>
        </div>
      </div>
      <button className="certificate__print-btn" onClick={handlePrint}>
        🖨️ Descargar / Imprimir
      </button>
    </div>
  );
}
