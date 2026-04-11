import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HomePage from './pages/HomePage';
import UserDashboard from './pages/UserDashboard';
import EventDetailPage from './pages/EventDetailPage';
import CreateEventPage from './pages/CreateEventPage';
import Navbar from './components/Navbar';
import './index.css';

// placeholder pages — to be built in Sprint 2
{/*const BusinessDashboard = () => (
  <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
    <h1>Business Dashboard: </h1>
  </div>
);
const AdminDashboard = () => (
  <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
    <h1>Admin Dashboard — tbd</h1>
  </div>
); */}

// sends each role to their correct page after login
const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  //if (role === 'business') return <Navigate to="/business/dashboard" replace />;
  //if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/home" replace />;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      {/* public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRoles={['user', 'business', 'admin']}>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id"
        element={
          <ProtectedRoute allowedRoles={['user', 'business', 'admin']}>
            <EventDetailPage />
          </ProtectedRoute>
        }
      />

      {/* business routes */}
      {/*<Route
        path="/business/dashboard"
        element={
          <ProtectedRoute allowedRoles={['business']}>
            <BusinessDashboard />
          </ProtectedRoute>
        }
      />*/}
      <Route
        path="/create-event"
        element={
          <ProtectedRoute allowedRoles={['business']}>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['user', 'business', 'admin']}>
            <UserDashboard />
          </ProtectedRoute>
        }
/>
      {/* admin routes */}
      {/*<Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
      />
      }*/}
      

      {/* default: redirect based on role */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  </>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;