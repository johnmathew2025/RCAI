import React, { useEffect, useState } from "react";

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

  async function load() {
    const res = await fetch("/api/admin/ai/providers", { 
      credentials: "include",
      headers: { "x-user-id": "test-admin" }
    });
    if (!res.ok) {
      setToast(`Load failed: ${res.status}`);
      return;
    }
    const json = await res.json();
    setRows(json ?? []);
  }

  useEffect(() => { load(); }, []);

  async function save() {
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
          "Content-Type": "application/json",
          "x-user-id": "test-admin"
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
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
        credentials: "include",
        headers: { "x-user-id": "test-admin" }
      });
      const json = await res.json().catch(() => ({}));
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
          "Content-Type": "application/json",
          "x-user-id": "test-admin"
        },
        credentials: "include",
        body: JSON.stringify({ setActive: true }),
      });
      const json = await res.json().catch(() => ({}));
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

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border">
        <h3 className="font-semibold text-lg">Add AI Provider</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <label className="flex flex-col">
            <span className="text-sm">Provider (e.g., openai, anthropic, google)</span>
            <input className="border rounded px-3 py-2" value={provider}
              onChange={e => setProvider(e.target.value)} placeholder="openai" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Model ID</span>
            <input className="border rounded px-3 py-2" value={modelId}
              onChange={e => setModelId(e.target.value)} placeholder="gpt-4o-mini" />
          </label>
          <label className="flex flex-col md:col-span-2">
            <span className="text-sm">API Key (stored encrypted, never shown again)</span>
            <input className="border rounded px-3 py-2" value={apiKey} type="password"
              onChange={e => setApiKey(e.target.value)} placeholder="sk-..." />
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={makeActive} onChange={e => setMakeActive(e.target.checked)} />
            <span>Set as active provider</span>
          </label>
        </div>
        <div className="mt-4">
          <button disabled={busy || !provider || !modelId || !apiKey}
            onClick={save}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
            Save Provider
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