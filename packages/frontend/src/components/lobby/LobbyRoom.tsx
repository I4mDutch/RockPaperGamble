import React, { useCallback, useEffect, useMemo, useState } from "react";

type Player = {
  id?: string;
  name?: string;
  ready?: boolean;
  [key: string]: any;
};

type LobbySession = {
  players?: Player[];
  [key: string]: any;
};

type LobbyRoomProps = {
  session?: LobbySession | null;
  players?: Player[];
  send: (msg: any) => void;
  currentUserId?: string;
  isHost?: boolean;
};

/**
 * HostControls
 * Extracted host-only UI and hooks into a separate component so the parent
 * LobbyRoom can always run its hooks in the same order.
 */
function HostControls({
  players,
  onReorder,
  onToggleReadyAll,
  isHost,
}: {
  players: Player[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleReadyAll: () => void;
  isHost: boolean;
}) {
  const [localSort, setLocalSort] = useState<"asc" | "desc">("asc");

  const reorderUp = useCallback(
    (index: number) => {
      if (!isHost || index <= 0) return;
      onReorder(index, index - 1);
    },
    [isHost, onReorder]
  );

  const reorderDown = useCallback(
    (index: number) => {
      if (!isHost || index >= players.length - 1) return;
      onReorder(index, index + 1);
    },
    [isHost, onReorder, players.length]
  );

  const toggleAllReady = useCallback(() => {
    onToggleReadyAll();
  }, [onToggleReadyAll]);

  return (
    <div className="host-controls" style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={toggleAllReady} aria-label="Toggle ready all">
          Toggle Ready All
        </button>
        <label style={{ marginLeft: 12 }}>
          Sort:
          <select
            value={localSort}
            onChange={(e) => setLocalSort(e.target.value as "asc" | "desc")}
            style={{ marginLeft: 6 }}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </label>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {players.map((p, i) => (
          <li
            key={p.id ?? p.name ?? i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span style={{ flex: 1 }}>{p.name ?? `Player ${i + 1}`}</span>
            <button
              onClick={() => reorderUp(i)}
              disabled={!isHost || i === 0}
              aria-label={`move-${i}-up`}
            >
              ▲
            </button>
            <button
              onClick={() => reorderDown(i)}
              disabled={!isHost || i === players.length - 1}
              aria-label={`move-${i}-down`}
            >
              ▼
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * LobbyRoom
 * All hooks used by this component are declared at the top-level so their order
 * is stable across renders. Host-only logic uses HostControls which is a child
 * component and may be conditionally rendered.
 */
export default function LobbyRoom({
  session,
  players = [],
  send,
  currentUserId,
  isHost = false,
}: LobbyRoomProps) {
  // Top-level hooks only
  const [localPlayers, setLocalPlayers] = useState<Player[]>(() =>
    Array.isArray(players) ? players.slice() : []
  );
  const [connected, setConnected] = useState<boolean>(!!session);
  const [error, setError] = useState<string | null>(null);

  // Keep localPlayers in sync with players prop / session authoritative source
  useEffect(() => {
    setLocalPlayers(Array.isArray(players) ? players.slice() : []);
  }, [players]);

  useEffect(() => {
    setConnected(!!session);
  }, [session]);

  // Stable send handlers that broadcast intents to the server
  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      // normalize & broadcast reorder intent
      send({ type: "lobby:reorder", payload: { from: fromIndex, to: toIndex } });
    },
    [send]
  );

  const handleToggleReadyAll = useCallback(() => {
    send({ type: "lobby:toggle_ready_all" });
  }, [send]);

  const handleToggleReady = useCallback(
    (id?: string) => {
      send({ type: "lobby:toggle_ready", payload: { id } });
    },
    [send]
  );

  // Example: derive player list from session if session contains authoritative list
  useEffect(() => {
    if (!session) return;
    if (Array.isArray(session.players)) {
      setLocalPlayers(session.players.slice());
    }
  }, [session]);

  const playerList = useMemo(() => localPlayers, [localPlayers]);

  if (!connected) {
    return <div className="lobby-room">Connecting…</div>;
  }

  return (
    <div className="lobby-room" style={{ padding: 12 }}>
      {error && (
        <div className="error" style={{ color: "red", marginBottom: 8 }}>
          {error}
        </div>
      )}

      <div>
        <h2>Lobby</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {playerList.map((p, idx) => (
            <li
              key={p.id ?? p.name ?? idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span style={{ flex: 1 }}>{p.name ?? `Player ${idx + 1}`}</span>
              {p.ready ? (
                <span style={{ color: "green" }}>Ready</span>
              ) : (
                <span style={{ color: "#666" }}>Not ready</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Host-only controls extracted into a child component */}
      {isHost ? (
        <HostControls
          players={playerList}
          onReorder={handleReorder}
          onToggleReadyAll={handleToggleReadyAll}
          isHost={isHost}
        />
      ) : (
        <div className="guest-controls" style={{ marginTop: 12 }}>
          <button
            onClick={() => handleToggleReady(currentUserId)}
            aria-label="ready-toggle"
          >
            Ready / Unready
          </button>
        </div>
      )}
    </div>
  );
}
