import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CompanyDetail from './pages/CompanyDetail';
import AdminPanel from './pages/AdminPanel';
import AddCompany from './pages/AddCompany';
import AddContent from './pages/AddContent';
import CompanyAdmin from './pages/CompanyAdmin';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="company/:id" element={<CompanyDetail />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="admin/company/new"
            element={
              <AdminRoute>
                <AddCompany />
              </AdminRoute>
            }
          />
          <Route
            path="admin/company/:id/edit"
            element={
              <AdminRoute>
                <AddCompany />
              </AdminRoute>
            }
          />
          <Route
            path="admin/company/:id/content"
            element={
              <AdminRoute>
                <AddContent />
              </AdminRoute>
            }
          />
          <Route
            path="admin/company/:id"
            element={
              <AdminRoute>
                <CompanyAdmin />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
