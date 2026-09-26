"use client";

import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "/components/ui";

export function AddFriendForm({
  onAdded,
  disabled,
  disabledHint,
}: {
  onAdded: () => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [riotId, setRiotId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (disabled) return;
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
    <form onSubmit={submit} className="px-5 py-4">
      <label htmlFor="riot-id" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-fg-dim">
        Agregar amigo
      </label>
      <div className="flex gap-2">
        <input
          id="riot-id"
          value={riotId}
          onChange={(e) => setRiotId(e.target.value)}
          placeholder="GameName#TAG"
          required
          disabled={disabled}
          autoComplete="off"
          className="focus-ring h-10 min-w-0 flex-1 rounded-xl border border-ink-600/80 bg-ink-950/70 px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-fg-dim focus:border-gold-500/60 disabled:opacity-50"
        />
        <Button type="submit" variant="primary" loading={busy} disabled={disabled || !riotId.trim()} icon={<UserPlus size={16} />}>
          Agregar
        </Button>
      </div>
      {disabled && disabledHint && <p className="mt-2 text-xs text-fg-dim">{disabledHint}</p>}
      {error && <p className="mt-2 text-xs text-loss">{error}</p>}
      {ok && <p className="mt-2 text-xs text-win">{ok}</p>}
    </form>
  );
}
