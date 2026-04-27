import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import api from '../api/client';

interface MedicalRecord {
  id: number;
  patient_id: number;
  title: string;
  description: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
}

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRecords = async () => {
    try {
      const res = await api.get<MedicalRecord[]>('/medical-records/');
      setRecords(res.data);
    } catch {
      setError('Failed to load medical records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (file) formData.append('file', file);

      await api.post('/medical-records/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTitle('');
      setDescription('');
      setFile(null);
      setShowForm(false);
      fetchRecords();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to upload record.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = (record: MedicalRecord) => {
    const url = `/api/medical-records/${record.id}/download`;
    const a = document.createElement('a');
    a.href = url;
    a.download = record.file_name ?? 'download';
    a.click();
  };

  const fileIcon = (fileType: string | null) => {
    if (!fileType) return '📄';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📋';
    return '📄';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏥 Medical Records</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancel' : '+ Upload Record'}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">New Medical Record</h2>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Title *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Blood Test Report, X-Ray 2024"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional notes about this record…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                File (PDF, image, or text)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt"
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFile(e.target.files?.[0] ?? null)
                }
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
              >
                {submitting ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records list */}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🏥</div>
          <p>No medical records yet. Upload your first record!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-4"
            >
              <span className="text-3xl mt-0.5">{fileIcon(r.file_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{r.title}</p>
                {r.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(r.created_at).toLocaleDateString()}
                  {r.file_name && (
                    <>
                      {' · '}
                      <span className="font-mono">{r.file_name}</span>
                    </>
                  )}
                </p>
              </div>
              {r.file_name && (
                <button
                  onClick={() => handleDownload(r)}
                  className="text-xs text-blue-600 hover:underline shrink-0"
                >
                  ⬇ Download
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
