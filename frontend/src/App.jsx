import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import InstructorRoute from './components/InstructorRoute';
import PanelLayout from './components/PanelLayout';

import HomePage from './pages/HomePage';
import CoursePage from './pages/CoursePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import BecomeInstructorPage from './pages/BecomeInstructorPage';
import InstructorProfilePage from './pages/InstructorProfilePage';
import InstructorSettings from './pages/instructor/InstructorSettings';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminVideos from './pages/admin/AdminVideos';
import AdminUsers from './pages/admin/AdminUsers';
import AdminComments from './pages/admin/AdminComments';
import AdminInstructors from './pages/admin/AdminInstructors';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Auth (público) */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/registro" element={<RegisterPage />} />
                    <Route path="/verificar/:token" element={<VerifyEmailPage />} />
                    <Route path="/olvide-contrasena" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                    {/* Catálogo (público: los visitantes pueden explorar antes de registrarse) */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/cursos/:slug" element={<CoursePage />} />
                    <Route path="/instructores/:id" element={<InstructorProfilePage />} />
                    <Route path="/ser-instructor" element={<BecomeInstructorPage />} />

                    {/* App (privado) */}
                    <Route path="/perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

                    {/* Panel del instructor (privado + rol instructor/admin) */}
                    <Route path="/instructor" element={<InstructorRoute><PanelLayout mode="instructor" /></InstructorRoute>}>
                        <Route index element={<AdminCourses mode="instructor" />} />
                        <Route path="cursos/:courseId/videos" element={<AdminVideos mode="instructor" />} />
                        <Route path="perfil" element={<InstructorSettings />} />
                    </Route>

                    {/* Admin (privado + rol admin) */}
                    <Route path="/admin" element={<AdminRoute><PanelLayout mode="admin" /></AdminRoute>}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="cursos" element={<AdminCourses mode="admin" />} />
                        <Route path="cursos/:courseId/videos" element={<AdminVideos mode="admin" />} />
                        <Route path="instructores" element={<AdminInstructors />} />
                        <Route path="usuarios" element={<AdminUsers />} />
                        <Route path="comentarios" element={<AdminComments />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
