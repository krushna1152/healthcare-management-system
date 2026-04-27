import { useState, type FormEvent } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPw && newPw !== confirmPw) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string | undefined> = {
        full_name: fullName || undefined,
        email: email !== user?.email ? email : undefined,
        current_password: newPw ? currentPw : undefined,
        new_password: newPw || undefined,
      };
      await api.put('/auth/profile', body);
      await refreshUser();
      setSuccess('Profile updated successfully!');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to update profile.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setVerifyMsg('');
    setVerifying(true);
    try {
      await api.get(`/auth/verify-email?token=${encodeURIComponent(verifyToken)}`);
      await refreshUser();
      setVerifyMsg('✅ Email verified successfully!');
      setVerifyToken('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Verification failed.';
      setVerifyMsg(`❌ ${msg}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Profile & Settings</h1>

      {/* Email verification banner */}
      {!user?.email_verified && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl p-4 mb-6">
          <p className="font-medium text-sm mb-2">
            ⚠️ Your email is not verified. Enter the verification token from your registration to verify.
          </p>
          <form onSubmit={handleVerify} className="flex gap-2">
            <input
              type="text"
              placeholder="Paste verification token…"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              className="flex-1 border border-yellow-400 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              disabled={verifying || !verifyToken}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
            >
              {verifying ? 'Verifying…' : 'Verify'}
            </button>
          </form>
          {verifyMsg && <p className="text-sm mt-2">{verifyMsg}</p>}
        </div>
      )}

      {user?.email_verified && (
        <div className="bg-green-50 border border-green-300 text-green-700 rounded-xl p-3 mb-6 text-sm font-medium">
          ✅ Email verified
        </div>
      )}

      {/* Profile form */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="mb-4 text-sm text-gray-500">
          Role: <span className="capitalize font-medium text-gray-700">{user?.role}</span>
          &nbsp;|&nbsp;
          Member since:{' '}
          <span className="font-medium text-gray-700">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
          </span>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 mb-4 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {email !== user?.email && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Changing email will require re-verification.
              </p>
            )}
          </div>

          {/* Password change */}
          <hr className="border-gray-100" />
          <h3 className="text-sm font-semibold text-gray-600">Change Password (optional)</h3>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">New Password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium text-sm px-6 py-2 rounded-lg transition"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
