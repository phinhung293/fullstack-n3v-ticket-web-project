import { Navigate } from 'react-router-dom';
import { getAuthUser } from '../utils/authStorage';

type ProtectedRouteProps = {
    children: React.ReactNode;
    adminOnly?: boolean;
};

function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
    const authUser = getAuthUser();

    if (!authUser) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && authUser.role !== 'ROLE_ADMIN') {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;