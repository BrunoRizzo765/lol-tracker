"use client";

import { useState, type FormEvent } from "react";

export function AddFriendForm({ onAdded }: { onAdded: () => void }) {
  const [riotId, setRiotId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    try {
      const r = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotId }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "No se pudo agregar");
      setRiotId("");
      setOk(`Agregado: ${json.friend.gameName}#${json.friend.tagLine}`);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-bold">Agregar amigo</h2>
      <p className="mt-1 text-sm text-slate-500">Riot ID completo, por ejemplo <code className="text-slate-400">Nombre#TAG</code>.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={riotId}
          onChange={(e) => setRiotId(e.target.value)}
          placeholder="GameName#TAG"
          required
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={busy || !riotId.trim()}
          className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
        >
          {busy ? "Validando…" : "Agregar"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {ok && <p className="mt-3 text-sm text-cyan-300">{ok}</p>}
    </form>
  );
}
