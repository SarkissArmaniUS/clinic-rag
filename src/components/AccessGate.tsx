"use client";

import { useState } from "react";

export default function AccessGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [key, setKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (res.ok) {
        onUnlocked();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Failed to verify the code.");
    } catch {
      setMessage("Failed to verify the code.");
    } finally {
      setLoading(false);
    }
  }

  return (
      <form onSubmit={submit} className="space-y-2 rounded-lg border border-slate-200 p-4">
        <p className="text-sm text-slate-700">
          An access code is required for the demo. Enter it to continue.
        </p>
        <div className="flex gap-2">
          <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Access code"
              aria-label="Access code"
              autoComplete="off"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
          />
          <button
              type="submit"
              disabled={loading || !key.trim()}
              className="rounded-lg bg-teal-700 px-4 py-2 text-white disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Sign in
          </button>
        </div>
        {message && (
            <p role="alert" className="text-sm text-red-700">
              {message}
            </p>
        )}
      </form>
  );
}