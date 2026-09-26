"use client";

import { RadioTower, RefreshCw } from "lucide-react";
import { Button, Chip } from "/components/ui";
import { timeAgo } from "/lib/format";

export function TopBar({
  syncing,
  loading,
  onSync,
  onReload,
  updatedAt,
  liveCount,
  demo,
}: {
  syncing: boolean;
  loading: boolean;
  onSync: () => void;
  onReload: () => void;
  updatedAt: number | null;
  liveCount: number;
  demo?: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Logo />
          <div className="min-w-0">
            <p className="font-display text-base font-bold leading-tight tracking-tight">
              Friends <span className="text-gradient-gold">Tracker</span>
            </p>
            <p className="hidden text-[11px] text-fg-dim sm:block">
              {updatedAt ? `Actualizado ${timeAgo(updatedAt)}` : "League of Legends · LAS"}
            </p>
          </div>
          <div className="ml-1 hidden items-center gap-2 md:flex">
            {liveCount > 0 && (
              <Chip tone="live">
                <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse-ring" />
                {liveCount} en partida
              </Chip>
            )}
            {demo && <Chip tone="gold">Demo</Chip>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReload}
            disabled={loading || syncing}
            loading={loading && !syncing}
            icon={<RadioTower size={14} />}
            title="Refrescar rangos y partidas en vivo"
          >
            <span className="hidden sm:inline">Rangos / live</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSync}
            disabled={loading || syncing || Boolean(demo)}
            loading={syncing}
            icon={<RefreshCw size={14} />}
            title={demo ? "No disponible en modo demo" : "Traer partidas nuevas desde Riot"}
          >
            <span className="hidden sm:inline">{syncing ? "Sincronizando" : "Actualizar partidas"}</span>
            <span className="sm:hidden">Sync</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-gold-500/40 bg-gradient-to-br from-gold-500/25 to-transparent shadow-[0_0_24px_-8px_rgb(201_167_92/0.9)]">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2.5 20.2 7.25v9.5L12 21.5 3.8 16.75v-9.5L12 2.5Z" stroke="#e4c98a" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 7.5v9M8.2 9.75l7.6 4.5M15.8 9.75l-7.6 4.5" stroke="#e4c98a" strokeWidth="1.4" strokeLinecap="round" opacity=".8" />
      </svg>
    </span>
  );
}
