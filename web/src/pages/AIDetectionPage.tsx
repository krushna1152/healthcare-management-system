import { useState } from 'react';
import type { ChangeEvent } from 'react';
import api from '../api/client';

interface DetectionResult {
  predicted_class: string;
  confidence: number;
  top_predictions: { label: string; confidence: number }[];
}

export default function AIDetectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<DetectionResult>(
        '/ai/detect-skin-disease',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setResult(res.data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Detection failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const confidencePct = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        🔬 AI Disease Detection
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Upload a skin image and our AI model will classify potential conditions.
      </p>

      {/* Upload area */}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-6 hover:border-blue-400 transition">
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          {preview ? (
            <img
              src={preview}
              alt="Selected"
              className="mx-auto max-h-56 rounded-xl object-cover mb-3"
            />
          ) : (
            <div className="text-5xl mb-3">🖼️</div>
          )}
          <p className="text-sm text-gray-500">
            {file ? file.name : 'Click to select an image (JPG, PNG, WEBP)'}
          </p>
        </label>
      </div>

      <button
        onClick={handleDetect}
        disabled={!file || loading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition mb-6"
      >
        {loading ? 'Analysing…' : 'Detect Disease'}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Detection Results
          </h2>

          <div className="flex items-center gap-4 bg-purple-50 border border-purple-200 rounded-xl p-4 mb-5">
            <div className="text-4xl">🩺</div>
            <div>
              <p className="text-sm text-purple-600 font-medium mb-0.5">
                Predicted Condition
              </p>
              <p className="text-xl font-bold text-purple-800">
                {result.predicted_class}
              </p>
              <p className="text-sm text-purple-600">
                Confidence: {confidencePct(result.confidence)}
              </p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            Top Predictions
          </h3>
          <div className="space-y-2">
            {result.top_predictions.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-sm text-gray-700 mb-0.5">
                  <span>{p.label}</span>
                  <span>{confidencePct(p.confidence)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: confidencePct(p.confidence) }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-gray-400">
            ⚠️ This result is for informational purposes only and is not a
            medical diagnosis. Please consult a qualified healthcare professional.
          </p>
        </div>
      )}
    </div>
  );
}
