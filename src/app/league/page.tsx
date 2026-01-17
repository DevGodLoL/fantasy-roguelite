"use client";

import { useEffect, useState } from "react";

type League = {
  id: string;
  name: string;
  teams: { id: string; name: string }[];
  weeks: { id: string; number: number }[];
  matchups: any[];
};

type DebugResponse = { league: League | null };

type Powerup = {
  id: string;
  code: string;
  name: string;
  description: string;
  rarity: string;
  scope: string;
  duration: string;
  kind: string | null;
  value: number | null;
};

export default function LeaguePage() {
  const [league, setLeague] = useState<League | null>(null);

  const [loadingPack, setLoadingPack] = useState(false);
  const [picks, setPicks] = useState<Powerup[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [weekId, setWeekId] = useState<string | null>(null);

  const [selecting, setSelecting] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetch("/api/debug", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: DebugResponse) => setLeague(d.league));
  }, []);

  async function openPack() {
    setLoadingPack(true);
    setMessage("");
    setSelectedId(null);
    setPicks([]);

    const res = await fetch("/api/packs/open", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data?.error ?? "Failed to open pack");
      setLoadingPack(false);
      return;
    }

    setTeamId(data.teamId);
    setWeekId(data.weekId);
    setPicks(data.picks ?? []);
    setLoadingPack(false);
  }

  async function selectPowerup(powerupId: string) {
    if (!teamId || !weekId) {
      setMessage("Missing team/week context. Open a pack first.");
      return;
    }

    setSelecting(powerupId);
    setMessage("");

    const res = await fetch("/api/packs/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, weekId, powerupId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data?.error ?? "Failed to select powerup");
      setSelecting(null);
      return;
    }

    setSelectedId(powerupId);
    setMessage(data.already ? "Already selected earlier." : "Powerup selected! ✅");
    setSelecting(null);
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        {league ? league.name : "Loading..."}
      </h1>

      {league && (
        <>
          <h2 style={{ marginTop: 16, fontSize: 18, fontWeight: 600 }}>Teams</h2>
          <ul>
            {league.teams.map((t) => (
              <li key={t.id}>{t.name}</li>
            ))}
          </ul>
        </>
      )}

      <section style={{ marginTop: 28 }}>
        <button
          onClick={openPack}
          disabled={loadingPack}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #333",
            cursor: "pointer",
          }}
        >
          {loadingPack ? "Opening..." : "Open Pack"}
        </button>

        {message && <p style={{ marginTop: 12 }}>{message}</p>}

        {picks.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Choose 1 card</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {picks.map((p) => {
                const isSelected = selectedId === p.id;
                const isBusy = selecting === p.id;

                return (
                  <button
                    key={p.id}
                    onClick={() => selectPowerup(p.id)}
                    disabled={!!selectedId || isBusy}
                    style={{
                      textAlign: "left",
                      padding: 14,
                      borderRadius: 14,
                      border: "1px solid #333",
                      background: isSelected ? "#e8ffe8" : "white",
                      cursor: !!selectedId ? "default" : "pointer",
                      opacity: isBusy ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                      {p.rarity} • {p.scope} • {p.duration}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13 }}>{p.description}</div>
                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                      {p.code}
                      {p.kind ? ` • ${p.kind}` : ""}
                      {p.value != null ? ` • ${p.value}` : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
