// Etiqueta usada cuando ningún video de un grupo mixto tiene sección asignada.
export const GENERAL_SECTION = 'Contenido del curso';

// Agrupa una lista de videos por su campo `section`, preservando el orden de aparición.
// Si ningún video tiene sección, devuelve null (el llamador debe mostrar una lista plana).
export function groupVideosBySection(videos) {
  const hasSections = videos.some(v => v.section);
  if (!hasSections) return null;

  const map = new Map();
  videos.forEach(v => {
    const key = v.section || GENERAL_SECTION;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(v);
  });
  return Array.from(map.entries());
}

// Siguiente video "natural" para el botón Continuar: el primer video no completado
// y no bloqueado; si no hay ninguno, el primer video sin bloquear; si todo está
// bloqueado, el primero de la lista.
export function findNextVideo(videos) {
  if (videos.length === 0) return null;
  return (
    videos.find(v => !v.completed && !v.locked) ||
    videos.find(v => !v.locked) ||
    videos[0]
  );
}
