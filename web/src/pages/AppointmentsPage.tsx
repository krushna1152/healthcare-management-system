import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Appointment {
  id: number;
  patient_name: string;
  doctor_name: string;
  appointment_date: string;
  status: string;
}

interface AppointmentForm {
  patient_name: string;
  doctor_name: string;
  appointment_date: string;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_OPTIONS = ['all', 'scheduled', 'completed', 'cancelled'];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AppointmentForm>({
    patient_name: '',
    doctor_name: '',
    appointment_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAppointments = async (q?: string, st?: string) => {
    try {
      const params = new URLSearchParams();
      if (q) params.append('search', q);
      if (st && st !== 'all') params.append('status', st);
      const res = await api.get<Appointment[]>(`/appointments/?${params.toString()}`);
      setAppointments(res.data);
    } catch {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(search, statusFilter);
  }, [search, statusFilter]);

  const handleBook = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/appointments/', form);
      toast.success('Appointment booked successfully!');
      setForm({ patient_name: '', doctor_name: '', appointment_date: '' });
      setShowForm(false);
      fetchAppointments(search, statusFilter);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Failed to book appointment.';
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.patch(`/appointments/${id}`, { status: 'cancelled' });
      toast.success('Appointment cancelled.');
      fetchAppointments(search, statusFilter);
    } catch {
      toast.error('Failed to cancel appointment.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📅 Appointments</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancel' : '+ Book Appointment'}
        </button>
      </div>

      {/* Booking form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            New Appointment
          </h2>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleBook} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Patient Name
              </label>
              <input
                required
                value={form.patient_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, patient_name: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Doctor Name
              </label>
              <input
                required
                value={form.doctor_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, doctor_name: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={form.appointment_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, appointment_date: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
              >
                {submitting ? 'Booking…' : 'Book'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search patient or doctor name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Appointments list */}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📅</div>
          <p>No appointments found. Book your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
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
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {a.status}
                </span>
                {a.status === 'scheduled' && (
                  <button
                    onClick={() => handleCancel(a.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
