import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function InstructorRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace state={{ from: '/instructor' }} />;
    if (!['instructor', 'admin'].includes(user.role)) return <Navigate to="/ser-instructor" replace />;
    return children;
}
