import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/dashboard" className="text-lg font-bold tracking-wide">
          🏥 HealthCare
        </Link>
        {user && (
          <div className="flex items-center gap-6 text-sm">
            <Link to="/dashboard" className="hover:text-blue-200 transition">
              Dashboard
            </Link>
            <Link to="/appointments" className="hover:text-blue-200 transition">
              Appointments
            </Link>
            <Link to="/billing" className="hover:text-blue-200 transition">
              Billing
            </Link>
            <Link to="/ai-detection" className="hover:text-blue-200 transition">
              AI Detection
            </Link>
            <span className="text-blue-300">|</span>
            <span className="text-blue-200">{user.email}</span>
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
