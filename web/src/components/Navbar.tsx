import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/dashboard" className="text-lg font-bold tracking-wide">
          🏥 HealthCare
        </Link>
        {user && (
          <div className="flex items-center gap-5 text-sm">
            <Link to="/dashboard" className="hover:text-blue-200 transition">
              Dashboard
            </Link>
            {isDoctor && (
              <Link to="/doctor-dashboard" className="hover:text-blue-200 transition">
                Doctor View
              </Link>
            )}
            <Link to="/appointments" className="hover:text-blue-200 transition">
              Appointments
            </Link>
            <Link to="/billing" className="hover:text-blue-200 transition">
              Billing
            </Link>
            <Link to="/medical-records" className="hover:text-blue-200 transition">
              Records
            </Link>
            <Link to="/ai-detection" className="hover:text-blue-200 transition">
              AI Detection
            </Link>
            <span className="text-blue-300">|</span>
            <NotificationsDropdown />
            <Link to="/profile" className="hover:text-blue-200 transition" title="Profile & Settings">
              👤
            </Link>
            <span className="text-blue-200 hidden sm:inline truncate max-w-[140px]">{user.full_name || user.email}</span>
            <button
              onClick={handleLogout}
              className="bg-blue-900 hover:bg-blue-800 px-3 py-1 rounded transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
