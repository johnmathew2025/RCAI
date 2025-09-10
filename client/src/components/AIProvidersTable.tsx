import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ProviderRow = {
  id: number;
  provider: string;
  modelId: string;
  active: boolean;
  hasKey: boolean;
};

type AuthState = {
  authenticated: boolean;
  loading: boolean;
  roles: string[];
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
  const [auth, setAuth] = useState<AuthState>({ authenticated: false, loading: true, roles: [] });

  // Check authentication status
  async function checkAuth() {
    try {
      const res = await fetch("/api/admin/whoami", { 
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setAuth({ authenticated: data.authenticated, loading: false, roles: data.roles || [] });
        return data.authenticated;
      } else {
        setAuth({ authenticated: false, loading: false, roles: [] });
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuth({ authenticated: false, loading: false, roles: [] });
      return false;
    }
  }

  async function load() {
    try {
      const res = await api("/api/admin/ai/providers");
      if (!res.ok) {
        setToast(`Load failed: ${res.status}`);
        return;
      }
      const json = await res.json();
      setRows(json ?? []);
    } catch (error) {
      if (error.message !== "unauthorized") {
        setToast("Load failed");
      }
    }
  }

  useEffect(() => { 
    checkAuth().then(isAuthenticated => {
      if (isAuthenticated) {
        load();
      } else {
        setToast("Please sign in.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 1500);
      }
    });
  }, []);

  async function save() {
    if (!auth.authenticated) {
      setToast("Please sign in.");
      return;
    }
    
    try {
      setBusy(true);
      setToast(null);
      const body = {
        provider: provider.trim().toLowerCase(),
        modelId: modelId.trim(),
        apiKey: apiKey,            // password; will be cleared after success
        setActive: !!makeActive,
      };
      const res = await fetch("/api/admin/ai/providers", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setToast("Please sign in.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 1500);
        return;
      }
      if (!res.ok) {
        setToast(json?.message || `Create failed: HTTP ${res.status}`);
        return;
      }
      setToast("Provider saved.");
      setApiKey(""); // never keep it in memory/UI after save
      setProvider("");
      setModelId("");
      setMakeActive(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function testProvider(id: number) {
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/ai/providers/${id}/test`, {
        method: "POST",
        credentials: "include"
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setToast("Please sign in.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 1500);
        return;
      }
      if (!res.ok) {
        setToast(json?.message || `Test failed: HTTP ${res.status}`);
        return;
      }
      setToast(json.ok ? `✅ Test OK (${json.latencyMs ?? "?"} ms)` : `❌ ${json.message || "Test failed"}`);
    } finally {
      setBusy(false);
    }
  }

  async function setActive(id: number) {
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/ai/providers/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ setActive: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setToast("Please sign in.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 1500);
        return;
      }
      if (!res.ok) {
        setToast(json?.message || `Activate failed: HTTP ${res.status}`);
        return;
      }
      await load();
      setToast("Active provider updated.");
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
      const res = await fetch(`/api/admin/ai/providers/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setToast("Please sign in.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 1500);
        return;
      }
      if (!res.ok) {
        setToast(json?.message || `Delete failed: HTTP ${res.status}`);
        return;
      }
      await load();
      if (json.reassignedActiveId) {
        setToast("Provider deleted. Another provider was set as active.");
      } else {
        setToast("Provider deleted successfully.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (auth.loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!auth.authenticated && (
        <div className="p-4 rounded-xl border bg-yellow-50 border-yellow-200">
          <div className="text-sm text-yellow-800">
            ⚠️ You are not signed in. Please <a href="/admin/login" className="underline font-semibold">sign in</a> to manage AI providers.
          </div>
        </div>
      )}
      
      <div className="p-4 rounded-xl border">
        <h3 className="font-semibold text-lg">Add AI Provider</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <label className="flex flex-col">
            <span className="text-sm">Provider (e.g., openai, anthropic, google)</span>
            <input className="border rounded px-3 py-2" value={provider}
              onChange={e => setProvider(e.target.value)} placeholder="openai" 
              disabled={!auth.authenticated} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Model ID</span>
            <input className="border rounded px-3 py-2" value={modelId}
              onChange={e => setModelId(e.target.value)} placeholder="gpt-4o-mini" 
              disabled={!auth.authenticated} />
          </label>
          <label className="flex flex-col md:col-span-2">
            <span className="text-sm">API Key (stored encrypted, never shown again)</span>
            <input className="border rounded px-3 py-2" value={apiKey} type="password"
              onChange={e => setApiKey(e.target.value)} placeholder="sk-..." 
              disabled={!auth.authenticated} />
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={makeActive} onChange={e => setMakeActive(e.target.checked)} 
              disabled={!auth.authenticated} />
            <span>Set as active provider</span>
          </label>
        </div>
        <div className="mt-4">
          <button disabled={busy || !provider || !modelId || !apiKey || !auth.authenticated}
            onClick={save}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
            {!auth.authenticated ? "Please sign in" : "Save Provider"}
          </button>
        </div>
        {toast && <div className="mt-3 text-sm">{toast}</div>}
      </div>

      <div className="p-4 rounded-xl border">
        <h3 className="font-semibold text-lg">Current AI Providers</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Provider</th>
                <th className="py-2 pr-4">Model</th>
                <th className="py-2 pr-4">Active</th>
                <th className="py-2 pr-4">🔒 Key</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-neutral-500">No AI providers configured.</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4">{r.provider}</td>
                  <td className="py-2 pr-4">{r.modelId}</td>
                  <td className="py-2 pr-4">{r.active ? "Yes" : "No"}</td>
                  <td className="py-2 pr-4">{r.hasKey ? "Yes" : "No"}</td>
                  <td className="py-2 pr-4 flex gap-2">
                    <button className="px-3 py-1 border rounded"
                      disabled={busy || !r.hasKey}
                      onClick={() => testProvider(r.id)}>Test</button>
                    {!r.active && (
                      <button className="px-3 py-1 border rounded"
                        disabled={busy}
                        onClick={() => setActive(r.id)}>Set Active</button>
                    )}
                    <button className="px-3 py-1 border rounded text-red-600 hover:bg-red-50"
                      disabled={deletingId === r.id}
                      onClick={() => deleteProvider(r.id)}>
                      {deletingId === r.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-neutral-500">BUILD_ID: {import.meta?.env?.VITE_BUILD_ID ?? "dev"}</div>
    </div>
  );
}