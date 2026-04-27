import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const PATIENT_FEATURES = [
  {
    title: 'Appointments',
    description: 'Book and manage your upcoming appointments with doctors.',
    icon: '📅',
    href: '/appointments',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  {
    title: 'Billing',
    description: 'View invoices, payments, and receipts.',
    icon: '💳',
    href: '/billing',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
  },
  {
    title: 'Medical Records',
    description: 'Upload and view your health history and reports.',
    icon: '🏥',
    href: '/medical-records',
    color: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
  },
  {
    title: 'AI Disease Detection',
    description: 'Upload a skin image for AI-powered disease classification.',
    icon: '🔬',
    href: '/ai-detection',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
];

const DOCTOR_FEATURES = [
  {
    title: 'Doctor Dashboard',
    description: 'View all patients and manage appointments.',
    icon: '👨‍⚕️',
    href: '/doctor-dashboard',
    color: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
  },
  ...PATIENT_FEATURES,
];

export default function DashboardPage() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';
  const features = isDoctor ? DOCTOR_FEATURES : PATIENT_FEATURES;

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Email verification banner */}
      {!user?.email_verified && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-sm">
            ⚠️ Your email is not verified.{' '}
            <Link to="/profile" className="underline font-medium">
              Verify now →
            </Link>
          </span>
        </div>
      )}

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl p-6 mb-8 shadow">
        <h1 className="text-2xl font-bold mb-1">
          Welcome back, {user?.full_name || user?.email} 👋
        </h1>
        <p className="text-blue-100 text-sm">
          Role: <span className="capitalize font-medium">{user?.role}</span> &nbsp;|&nbsp; Account active since{' '}
          {user?.created_at
            ? new Date(user.created_at).toLocaleDateString()
            : '—'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Appointments', value: '—', icon: '📅' },
          { label: 'Pending Invoices', value: '—', icon: '📄' },
          { label: 'AI Scans Done', value: '—', icon: '🔬' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4"
          >
            <span className="text-3xl">{stat.icon}</span>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Access</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <Link
            key={f.title}
            to={f.href}
            className={`border rounded-2xl p-5 transition cursor-pointer ${f.color}`}
          >
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
