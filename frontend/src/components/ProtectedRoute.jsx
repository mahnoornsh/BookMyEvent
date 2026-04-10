import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  //waits until localStorage has been checked
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  //if not logged in, goes to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  //if wrong role, redirects to their correct dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'business') return <Navigate to="/business/dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }
  return children;
};
export default ProtectedRoute;
