import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AppointmentsPage from './pages/AppointmentsPage';
import BillingPage from './pages/BillingPage';
import AIDetectionPage from './pages/AIDetectionPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import ProfilePage from './pages/ProfilePage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="py-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor-dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <DoctorDashboardPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <PrivateRoute>
                <Layout>
                  <AppointmentsPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <PrivateRoute>
                <Layout>
                  <BillingPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/medical-records"
            element={
              <PrivateRoute>
                <Layout>
                  <MedicalRecordsPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/ai-detection"
            element={
              <PrivateRoute>
                <Layout>
                  <AIDetectionPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
