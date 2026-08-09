import excelThumb from '../assets/fondo_excel.jpg';
import wordThumb from '../assets/fondo_word.jpg';

// Imágenes de portada locales, usadas como respaldo mientras el curso no tenga
// un `thumbnail` cargado desde el panel admin (que hoy solo acepta una URL,
// no subida de archivos). Se identifican por slug.
const LOCAL_THUMBNAILS = {
    'excel-basico': excelThumb,
    'excel-intermedio': excelThumb,
    'excel-avanzado': excelThumb,
    'word-basico': wordThumb,
};

// Devuelve la imagen de portada a usar para un curso: la del backend si existe,
// si no la local por slug, o null si no hay ninguna (se muestra el placeholder).
export function resolveCourseThumbnail(course) {
    if (!course) return null;
    return course.thumbnail || LOCAL_THUMBNAILS[course.slug] || null;
}
