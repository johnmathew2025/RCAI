import React, { useState, useEffect } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Check if already authenticated on load
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/whoami", { 
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isAdmin) {
          // Already authenticated as admin, redirect using server configuration
          const urlParams = new URLSearchParams(window.location.search);
          const returnTo = urlParams.get('returnTo');
          // Use server-provided default if no returnTo specified
          window.location.href = returnTo || window.location.origin + '/admin/settings';
        }
      }
    } catch (error) {
      // Not authenticated, continue to login form
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setToast("Please enter email and password");
      return;
    }

    setBusy(true);
    setToast(null);

    try {
      // Get returnTo from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('returnTo');

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, password, returnTo })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setToast("Login successful! Redirecting...");
        setTimeout(() => {
          // Navigate to sanitized returnTo from server response
          window.location.href = data.returnTo;
        }, 1000);
      } else if (res.status === 401) {
        setToast("Invalid email or password");
      } else if (res.status === 429) {
        setToast("Too many login attempts. Please try again later.");
      } else {
        setToast(data.message || "Login failed");
      }
    } catch (error) {
      setToast("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Admin Sign In</h2>
          <p className="mt-2 text-sm text-gray-600">
            Access AI Settings and administration panel
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="admin@example.com"
              disabled={busy}
              data-testid="input-email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter your password"
              disabled={busy}
              data-testid="input-password"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !email || !password}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-login"
          >
            {busy ? "Signing in..." : "Sign In"}
          </button>

          {toast && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              toast.includes('successful') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`} data-testid="toast-message">
              {toast}
            </div>
          )}
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Secure admin authentication for RCA Intelligence Pro
          </p>
        </div>
      </div>
    </div>
  );
}