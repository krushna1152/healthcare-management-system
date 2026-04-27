import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Patient {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

interface Appointment {
  id: number;
  patient_name: string;
  doctor_name: string;
  appointment_date: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'patients' | 'appointments'>('appointments');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          api.get<Patient[]>('/doctor/patients'),
          api.get<Appointment[]>('/doctor/appointments'),
        ]);
        setPatients(pRes.data);
        setAppointments(aRes.data);
      } catch {
        setError('Failed to load doctor data. Make sure you have doctor/admin role.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPatients = patients.filter(
    (p) =>
      p.email.toLowerCase().includes(patientSearch.toLowerCase()) ||
      (p.full_name ?? '').toLowerCase().includes(patientSearch.toLowerCase())
  );

  const upcoming = appointments.filter((a) => a.status === 'scheduled');
  const today = new Date().toDateString();
  const todayAppts = appointments.filter(
    (a) => new Date(a.appointment_date).toDateString() === today
  );

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-2xl p-6 mb-8 shadow">
        <h1 className="text-2xl font-bold mb-1">
          👨‍⚕️ Doctor Dashboard
        </h1>
        <p className="text-teal-100 text-sm">
          Logged in as: <span className="font-medium">{user?.full_name || user?.email}</span> &nbsp;|&nbsp;
          Role: <span className="capitalize font-medium">{user?.role}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Patients', value: patients.length, icon: '👥' },
          { label: 'Total Appointments', value: appointments.length, icon: '📅' },
          { label: "Today's Appointments", value: todayAppts.length, icon: '📆' },
          { label: 'Upcoming', value: upcoming.length, icon: '⏰' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3"
          >
            <span className="text-3xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {(['appointments', 'patients'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'appointments' ? '📅 Appointments' : '👥 Patients'}
          </button>
        ))}
      </div>

      {activeTab === 'appointments' && (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <p className="text-gray-400 py-8 text-center">No appointments found.</p>
          ) : (
            appointments.map((a) => (
              <div
                key={a.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {a.patient_name} &rarr; Dr. {a.doctor_name}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(a.appointment_date).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {a.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'patients' && (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search patients by name or email…"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          {filteredPatients.length === 0 ? (
            <p className="text-gray-400 py-8 text-center">No patients found.</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">#</th>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p, i) => (
                    <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{p.full_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
