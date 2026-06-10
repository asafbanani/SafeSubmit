import { useState } from 'react';
import axios from 'axios';
import { resourcePreviewApi } from '../../services/api';

export default function ResourcePreviewPage() {
  const [url, setUrl]           = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    // Revoke any previous object URL to avoid memory leaks
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    setError(null);
    setLoading(true);

    try {
      const response = await resourcePreviewApi.fetch(url.trim());
      const objectUrl = URL.createObjectURL(response.data);
      setImageUrl(objectUrl);
    } catch (err) {
      let message = 'Failed to fetch the resource.';
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 422) {
          // The server returns a specific error message for SSRF rejections
          const raw = err.response?.data;
          // Blob response type means we need to parse the JSON from the blob
          if (raw instanceof Blob) {
            try {
              const text = await raw.text();
              const parsed = JSON.parse(text) as { error?: string };
              message = parsed.error ?? message;
            } catch {
              // fall through to generic
            }
          } else if (typeof raw === 'object' && raw !== null && 'error' in raw) {
            message = (raw as { error: string }).error;
          }
        } else if (status === 403) {
          message = 'You do not have permission to use this feature.';
        } else if (status === 401) {
          message = 'You must be logged in to use this feature.';
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resource Preview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fetch an external image through the server. Only URLs from trusted domains
          are accepted.
        </p>
      </div>

      <form onSubmit={handleFetch} className="space-y-4">
        <div>
          <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://upload.wikimedia.org/..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={loading}
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            Allowed domains: upload.wikimedia.org, images.unsplash.com
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Fetching...
            </>
          ) : 'Fetch Image'}
        </button>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {imageUrl && (
        <div className="rounded-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 font-medium border-b border-gray-200">
            Preview
          </div>
          <div className="p-4 flex justify-center bg-white">
            <img
              src={imageUrl}
              alt="Fetched resource preview"
              className="max-w-full max-h-96 object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
