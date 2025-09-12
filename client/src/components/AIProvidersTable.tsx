import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { API_ENDPOINTS, ADMIN_ROUTES } from "@/config/apiEndpoints";

type ProviderRow = {
  id: number;
  provider: string;
  modelId: string;
  active: boolean;
  hasKey: boolean;
};

export default function AIProvidersTable() {
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [provider, setProvider] = useState("");
  const [modelId, setModelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [makeActive, setMakeActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    try {
      const res = await api(API_ENDPOINTS.aiProviders());
      if (!res.ok) {
        setToast(`Load failed: ${res.status}`);
        return;
      }
      const json = await res.json();
      setRows(json ?? []);
    } catch (error: any) {
      if (error.message !== "unauthorized") {
        setToast("Load failed");
      }
    }
  }

  useEffect(() => { 
    // Only load if on admin route to prevent unauthorized API calls
    if (window.location.pathname.startsWith(ADMIN_ROUTES.BASE)) {
      load();
    }
  }, []);

  async function save() {
    if (!provider || !modelId || !apiKey) {
      setToast("All fields required.");
      return;
    }
    setBusy(true);
    setToast(null);
    try {
      const res = await api(API_ENDPOINTS.aiProviders(), {
        method: "POST",
        body: JSON.stringify({ 
          provider: provider.trim().toLowerCase(),
          modelId: modelId.trim(),
          apiKey: apiKey,
          setActive: !!makeActive
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setToast(json?.message || `Save failed: ${res.status}`);
        return;
      }
      setToast("Provider saved.");
      setProvider("");
      setModelId("");
      setApiKey("");
      setMakeActive(false);
      await load();
    } catch (err: any) {
      if (err.message !== "unauthorized") {
        setToast("Network error");
      }
    } finally {
      setBusy(false);
    }
  }

  async function testProvider(id: number) {
    setBusy(true);
    setToast(null);
    try {
      const res = await api(API_ENDPOINTS.aiProviderTest(id), {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast(json?.message || `Test failed: ${res.status}`);
        return;
      }
      setToast(json.ok ? `✅ Test OK (${json.latencyMs ?? "?"} ms)` : `❌ ${json.message || "Test failed"}`);
    } catch (err: any) {
      if (err.message !== "unauthorized") {
        setToast("Test failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function setActive(id: number) {
    setBusy(true);
    setToast(null);
    try {
      const res = await api(API_ENDPOINTS.aiProviderById(id), {
        method: "PATCH",
        body: JSON.stringify({ setActive: true }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setToast(json?.message || `Activate failed: ${res.status}`);
        return;
      }
      await load();
      setToast("Active provider updated.");
    } catch (err: any) {
      if (err.message !== "unauthorized") {
        setToast("Activate failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteProvider(id: number) {
    if (!confirm('Delete this provider? This removes its key and deactivates it.')) {
      return;
    }
    
    setDeletingId(id);
    setToast(null);
    try {
      const res = await api(API_ENDPOINTS.aiProviderById(id), {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setToast(json?.message || `Delete failed: ${res.status}`);
        return;
      }
      setToast("Provider deleted.");
      await load();
    } catch (err: any) {
      if (err.message !== "unauthorized") {
        setToast("Delete failed");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">AI Providers</h2>
      
      {toast && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded text-blue-800">
          {toast}
        </div>
      )}

      <div className="mb-6 p-4 border rounded">
        <h3 className="text-lg mb-3">Add Provider</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            className="border p-2 rounded"
            placeholder="Provider (e.g., openai)"
            value={provider}
            onChange={e => setProvider(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Model ID (e.g., gpt-4)"
            value={modelId}
            onChange={e => setModelId(e.target.value)}
          />
        </div>
        <input
          className="border p-2 rounded w-full mb-3"
          type="password"
          placeholder="API Key"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={makeActive}
              onChange={e => setMakeActive(e.target.checked)}
              className="mr-2"
            />
            Set as active
          </label>
          <button
            onClick={save}
            disabled={busy}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Provider</th>
              <th className="border border-gray-300 p-2 text-left">Model</th>
              <th className="border border-gray-300 p-2 text-left">Status</th>
              <th className="border border-gray-300 p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td className="border border-gray-300 p-2">{row.provider}</td>
                <td className="border border-gray-300 p-2">{row.modelId}</td>
                <td className="border border-gray-300 p-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    row.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {row.active ? 'Active' : 'Inactive'}
                  </span>
                  {row.hasKey && (
                    <span className="ml-2 px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                      Has Key
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 p-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => testProvider(row.id)}
                      disabled={busy}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => setActive(row.id)}
                      disabled={busy || row.active}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => deleteProvider(row.id)}
                      disabled={busy || deletingId === row.id}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === row.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No providers configured
          </div>
        )}
      </div>
    </div>
  );
}