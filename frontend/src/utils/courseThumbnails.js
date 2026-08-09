import excelThumb from '../assets/fondo_excel.jpg';
import wordThumb from '../assets/fondo_word.jpg';
import { resolveFileUrl } from '../api/client';

// Imágenes de portada locales, usadas como respaldo mientras el curso no tenga
// un `thumbnail` propio (subido desde el panel admin o por URL externa).
// Se identifican por slug.
const LOCAL_THUMBNAILS = {
    'excel-basico': excelThumb,
    'excel-intermedio': excelThumb,
    'excel-avanzado': excelThumb,
    'word-basico': wordThumb,
};

// Devuelve la imagen de portada a usar para un curso: la del backend si existe
// (subida local o URL externa, resuelta a una URL absoluta), si no la local por
// slug, o null si no hay ninguna (se muestra el placeholder).
export function resolveCourseThumbnail(course) {
    if (!course) return null;
    return resolveFileUrl(course.thumbnail) || LOCAL_THUMBNAILS[course.slug] || null;
}
