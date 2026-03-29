import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './index.css';

//placeholder pages #Mahnoor
const HomePage = () => (
  <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
    <h1> Customer Home — tbd</h1>
    <p>Event listing cards will go here.</p>
  </div>
);
const BusinessDashboard = () => (
  <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
    <h1> Business Dashboard — tbd</h1>
  </div>
);
const AdminDashboard = () => (
  <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
    <h1>🛡 Admin Dashboard</h1>
  </div>
);


//sends each role to their correct page
const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'business') return <Navigate to="/business/dashboard" replace />;
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/home" replace />;
};

const AppRoutes = () => (
  <Routes>
    {/* public routes */}
    <Route path="/login"  element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    {/* customer routes */}
    <Route
      path="/home"
      element={
        <ProtectedRoute allowedRoles={['user']}>
          <HomePage />
        </ProtectedRoute>
      }
    />

    {/* business routes */}
    <Route
      path="/business/dashboard"
      element={
        <ProtectedRoute allowedRoles={['business']}>
          <BusinessDashboard />
        </ProtectedRoute>
      }
    />

    {/* admin routes */}
    <Route
      path="/admin/dashboard"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />

    {/* ── default: smart redirect ── */}
    <Route path="*" element={<RootRedirect />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
