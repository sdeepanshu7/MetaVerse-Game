import { useEffect, useRef, useState } from "react";
import {
  Gamepad2,
  Users,
  MapPin,
  Wifi,
  WifiOff,
  Keyboard,
  Send,
  LogOut,
  MessageCircle,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type User = {
  x: number;
  y: number;
  userId: string;
  username?: string;
};

type CurrentUser = {
  x: number;
  y: number;
  userId: string;
};

type ChatMessage = {
  id: number;
  name: string;
  text: string;
};

type ArenaProps = {
  onAuthError: () => void;
  onLogout: () => void;
};

/* =========================================================
   CONFIG
========================================================= */

const TILE_SIZE = 50;

const SPACE_ID =
  import.meta.env.VITE_SPACE_ID ||
  "cmt5wunma0002g3y4ptssvuu3";

/*
 * WebSocket URL
 *
 * Local development:
 *   ws://localhost:3001
 *
 * Production:
 *   VITE_WS_URL is provided by Vercel
 *   and should contain:
 *   wss://metaverse-ws-349c.onrender.com
 */
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  "ws://localhost:3001";

/* =========================================================
   WORLD
========================================================= */

type Room = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const BACK_ROOM: Room = {
  x: 10,
  y: 0,
  w: 20,
  h: 3,
};

const LEFT_ROOM: Room = {
  x: 0,
  y: 3,
  w: 10,
  h: 13,
};

const RIGHT_ROOM: Room = {
  x: 30,
  y: 3,
  w: 10,
  h: 13,
};

const STAIRS_LEFT: Room = {
  x: 0,
  y: 16,
  w: 5,
  h: 8,
};

const STAIRS_RIGHT: Room = {
  x: 35,
  y: 16,
  w: 5,
  h: 8,
};

/* =========================================================
   PROPS
========================================================= */

type Prop =
  | {
      type: "kiosk";
      x: number;
      y: number;
      w: number;
      h: number;
      label: string;
      color: string;
    }
  | {
      type: "bookshelf";
      x: number;
      y: number;
      w: number;
      h: number;
    }
  | {
      type: "plant";
      x: number;
      y: number;
    }
  | {
      type: "table";
      x: number;
      y: number;
      w: number;
      h: number;
    }
  | {
      type: "sofa";
      x: number;
      y: number;
      w: number;
      h: number;
    }
  | {
      type: "rug";
      x: number;
      y: number;
      w: number;
      h: number;
    }
  | {
      type: "painting";
      x: number;
      y: number;
      w: number;
      h: number;
    }
  | {
      type: "door";
      x: number;
      y: number;
      w: number;
      h: number;
    };

const PROPS: Prop[] = [
  {
    type: "door",
    x: 15,
    y: 0,
    w: 2,
    h: 1,
  },
  {
    type: "door",
    x: 23,
    y: 0,
    w: 2,
    h: 1,
  },

  {
    type: "kiosk",
    x: 16,
    y: 4,
    w: 2,
    h: 3,
    label: "GUIDE",
    color: "#3b6fb3",
  },

  {
    type: "kiosk",
    x: 22,
    y: 4,
    w: 3,
    h: 3,
    label: "RANKING",
    color: "#b3453b",
  },

  {
    type: "bookshelf",
    x: 11,
    y: 4,
    w: 2,
    h: 3,
  },

  {
    type: "bookshelf",
    x: 27,
    y: 4,
    w: 2,
    h: 3,
  },

  {
    type: "plant",
    x: 10,
    y: 7,
  },

  {
    type: "plant",
    x: 29,
    y: 7,
  },

  {
    type: "table",
    x: 12,
    y: 9,
    w: 5,
    h: 2,
  },

  {
    type: "table",
    x: 23,
    y: 9,
    w: 5,
    h: 2,
  },

  {
    type: "sofa",
    x: 12,
    y: 12,
    w: 6,
    h: 2,
  },

  {
    type: "sofa",
    x: 22,
    y: 12,
    w: 6,
    h: 2,
  },

  {
    type: "rug",
    x: 18,
    y: 8,
    w: 4,
    h: 5,
  },

  {
    type: "painting",
    x: 2,
    y: 4,
    w: 5,
    h: 4,
  },

  {
    type: "painting",
    x: 33,
    y: 4,
    w: 5,
    h: 4,
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function Game({
  onAuthError,
  onLogout,
}: ArenaProps) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const wsRef =
    useRef<WebSocket | null>(null);

  const keysRef =
    useRef<Set<string>>(new Set());

  const animationRef =
    useRef<number | null>(null);

  const bubbleTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const [connected, setConnected] =
    useState(false);

  const [users, setUsers] =
    useState<User[]>([]);

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [messageInput, setMessageInput] =
    useState("");

  const [chatBubble, setChatBubble] =
    useState<{
      username: string;
      text: string;
    } | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const username =
    localStorage.getItem("username") ||
    "Player";

  const avatarLetter =
    username.charAt(0).toUpperCase();

  /* =======================================================
     WEBSOCKET CONNECTION
  ======================================================= */

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    /*
     * No token = no game.
     */
    if (!token) {
      setError(
        "You need to create an account for playing the game."
      );

      return;
    }

    /*
     * IMPORTANT:
     *
     * On Vercel:
     *
     * VITE_WS_URL =
     * https://? NO
     *
     * wss://metaverse-ws-349c.onrender.com
     *
     * WebSocket connections from an HTTPS website
     * should use WSS.
     *
     * During local development the fallback remains:
     *
     * ws://localhost:3001
     */

    console.log(
      "Connecting to:",
      WS_URL
    );

    console.log(
      "Joining space:",
      SPACE_ID
    );

    const ws =
      new WebSocket(WS_URL);

    wsRef.current = ws;

    ws.onopen = () => {
      console.log(
        "✅ WebSocket connected"
      );

      setConnected(true);
      setError(null);

      /*
       * Send authenticated join request.
       */
      ws.send(
        JSON.stringify({
          type: "join",

          payload: {
            spaceId: SPACE_ID,
            token,
            username,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message =
          JSON.parse(event.data);

        console.log(
          "📨 WebSocket:",
          message
        );

        handleWebSocketMessage(
          message
        );
      } catch (err) {
        console.error(
          "Invalid WebSocket message:",
          err
        );
      }
    };

    ws.onerror = () => {
      console.error(
        "❌ WebSocket error"
      );

      setConnected(false);

      setError(
        "Could not connect to the game server."
      );
    };

    ws.onclose = () => {
      console.log(
        "🔴 WebSocket disconnected"
      );

      setConnected(false);
    };

    return () => {
      ws.close();

      wsRef.current = null;

      if (bubbleTimeout.current) {
        clearTimeout(
          bubbleTimeout.current
        );
      }
    };
  }, [onAuthError, username]);

  /* =======================================================
     WEBSOCKET MESSAGE HANDLER
  ======================================================= */

  const handleWebSocketMessage = (
    message: any
  ) => {
    switch (message.type) {
      case "space-joined": {
        const user =
          message.payload?.user;

        if (user) {
          setCurrentUser({
            x: user.x,
            y: user.y,
            userId: user.userId,
          });
        }

        const existingUsers =
          message.payload?.users ||
          [];

        setUsers(existingUsers);

        break;
      }

      case "user-joined": {
        const user =
          message.payload?.user;

        if (!user) {
          break;
        }

        setUsers((prev) => {
          const exists =
            prev.some(
              (item) =>
                item.userId ===
                user.userId
            );

          if (exists) {
            return prev;
          }

          return [
            ...prev,
            user,
          ];
        });

        break;
      }

      case "user-left": {
        const userId =
          message.payload?.userId;

        if (!userId) {
          break;
        }

        setUsers((prev) =>
          prev.filter(
            (user) =>
              user.userId !==
              userId
          )
        );

        break;
      }

      case "movement": {
        const user =
          message.payload?.user;

        if (!user) {
          break;
        }

        setUsers((prev) =>
          prev.map((item) =>
            item.userId ===
            user.userId
              ? {
                  ...item,
                  x: user.x,
                  y: user.y,
                }
              : item
          )
        );

        if (
          currentUser &&
          user.userId ===
            currentUser.userId
        ) {
          setCurrentUser({
            x: user.x,
            y: user.y,
            userId:
              user.userId,
          });
        }

        break;
      }

      case "chat": {
        const chat =
          message.payload;

        if (!chat) {
          break;
        }

        const newMessage: ChatMessage = {
          id: Date.now(),
          name:
            chat.username ||
            "Player",
          text:
            chat.message ||
            "",
        };

        setMessages((prev) => [
          ...prev,
          newMessage,
        ]);

        setChatBubble({
          username:
            chat.username ||
            "Player",
          text:
            chat.message ||
            "",
        });

        if (bubbleTimeout.current) {
          clearTimeout(
            bubbleTimeout.current
          );
        }

        bubbleTimeout.current =
          setTimeout(() => {
            setChatBubble(null);
          }, 4000);

        break;
      }

      case "error": {
        console.error(
          "WebSocket server error:",
          message
        );

        if (
          message.payload?.message
        ) {
          setError(
            message.payload.message
          );
        }

        break;
      }

      default:
        console.log(
          "Unknown WebSocket message:",
          message
        );
    }
  };

  /* =======================================================
     SEND CHAT
  ======================================================= */

  const sendMessage = () => {
    const message =
      messageInput.trim();

    if (!message) {
      return;
    }

    const ws =
      wsRef.current;

    if (
      !ws ||
      ws.readyState !==
        WebSocket.OPEN
    ) {
      setError(
        "You are not connected to the game server."
      );

      return;
    }

    ws.send(
      JSON.stringify({
        type: "chat",
        payload: {
          message,
        },
      })
    );

    setMessageInput("");
  };

  /* =======================================================
     KEYBOARD
  ======================================================= */

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      const key =
        event.key.toLowerCase();

      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        keysRef.current.add(key);
      }
    };

    const handleKeyUp = (
      event: KeyboardEvent
    ) => {
      const key =
        event.key.toLowerCase();

      keysRef.current.delete(key);
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "keyup",
      handleKeyUp
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "keyup",
        handleKeyUp
      );
    };
  }, []);

  /* =======================================================
     DRAWING
  ======================================================= */

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const resizeCanvas = () => {
      const rect =
        canvas.getBoundingClientRect();

      canvas.width =
        rect.width *
        window.devicePixelRatio;

      canvas.height =
        rect.height *
        window.devicePixelRatio;

      ctx.setTransform(
        window.devicePixelRatio,
        0,
        0,
        window.devicePixelRatio,
        0,
        0
      );
    };

    resizeCanvas();

    window.addEventListener(
      "resize",
      resizeCanvas
    );

    return () => {
      window.removeEventListener(
        "resize",
        resizeCanvas
      );
    };
  }, []);

  /* =======================================================
     GAME LOOP
  ======================================================= */

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const draw = () => {
      const rect =
        canvas.getBoundingClientRect();

      const width =
        rect.width;

      const height =
        rect.height;

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      /*
       * World background
       */
      ctx.fillStyle =
        "#102f2d";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      /*
       * Grid
       */
      for (
        let x = 0;
        x < width;
        x += TILE_SIZE
      ) {
        for (
          let y = 0;
          y < height;
          y += TILE_SIZE
        ) {
          const even =
            ((x / TILE_SIZE) +
              (y / TILE_SIZE)) %
              2 ===
            0;

          ctx.fillStyle = even
            ? "#31998c"
            : "#2b8d82";

          ctx.fillRect(
            x,
            y,
            TILE_SIZE,
            TILE_SIZE
          );
        }
      }

      /*
       * Rooms
       */
      const drawRoom = (
        room: Room,
        color: string
      ) => {
        ctx.fillStyle =
          color;

        ctx.fillRect(
          room.x *
            TILE_SIZE,
          room.y *
            TILE_SIZE,
          room.w *
            TILE_SIZE,
          room.h *
            TILE_SIZE
        );
      };

      drawRoom(
        BACK_ROOM,
        "#704333"
      );

      drawRoom(
        LEFT_ROOM,
        "#704333"
      );

      drawRoom(
        RIGHT_ROOM,
        "#704333"
      );

      /*
       * Props
       */
      PROPS.forEach(
        (prop) => {
          const x =
            prop.x *
            TILE_SIZE;

          const y =
            prop.y *
            TILE_SIZE;

          if (
            prop.type ===
            "kiosk"
          ) {
            ctx.fillStyle =
              prop.color;

            ctx.fillRect(
              x,
              y,
              prop.w *
                TILE_SIZE,
              prop.h *
                TILE_SIZE
            );

            ctx.strokeStyle =
              "#ffffff";

            ctx.strokeRect(
              x,
              y,
              prop.w *
                TILE_SIZE,
              prop.h *
                TILE_SIZE
            );

            ctx.fillStyle =
              "#ffffff";

            ctx.font =
              "bold 14px sans-serif";

            ctx.textAlign =
              "center";

            ctx.fillText(
              prop.label,
              x +
                (prop.w *
                  TILE_SIZE) /
                  2,
              y +
                (prop.h *
                  TILE_SIZE) /
                  2
            );
          }

          if (
            prop.type ===
            "bookshelf"
          ) {
            ctx.fillStyle =
              "#c98942";

            ctx.fillRect(
              x,
              y,
              prop.w *
                TILE_SIZE,
              prop.h *
                TILE_SIZE
            );

            const colors = [
              "#c94b3b",
              "#3d6fb3",
              "#82a78d",
              "#e5ba45",
            ];

            for (
              let i = 0;
              i < 4;
              i++
            ) {
              ctx.fillStyle =
                colors[i];

              ctx.fillRect(
                x +
                  4 +
                  i *
                    18,
                y + 5,
                14,
                prop.h *
                    TILE_SIZE -
                  10
              );
            }
          }

          if (
            prop.type ===
            "plant"
          ) {
            ctx.fillStyle =
              "#8b5a32";

            ctx.fillRect(
              x + 12,
              y + 25,
              26,
              25
            );

            ctx.fillStyle =
              "#3d8f49";

            ctx.beginPath();

            ctx.arc(
              x + 25,
              y + 20,
              16,
              0,
              Math.PI * 2
            );

            ctx.fill();
          }

          if (
            prop.type ===
            "table"
          ) {
            ctx.fillStyle =
              "#c9a56e";

            ctx.fillRect(
              x,
              y,
              prop.w *
                TILE_SIZE,
              prop.h *
                TILE_SIZE
            );
          }

          if (
            prop.type ===
            "sofa"
          ) {
            ctx.fillStyle =
              "#b34c3c";

            ctx.fillRect(
              x,
              y,
              prop.w *
                TILE_SIZE,
              prop.h *
                TILE_SIZE
            );
          }

          if (
            prop.type ===
            "rug"
          ) {
            ctx.fillStyle =
              "#d9b84a";

            ctx.fillRect(
              x,
              y,
              prop.w *
                TILE_SIZE,
              prop.h *
                TILE_SIZE
            );
          }

          if (
            prop.type ===
            "painting"
          ) {
            ctx.fillStyle =
              "#d3c7a4";

            ctx.fillRect(
              x,
              y,
              prop.w *
                TILE_SIZE,
              prop.h *
                TILE_SIZE
            );

            ctx.strokeStyle =
              "#b3453b";

            ctx.lineWidth = 4;

            ctx.strokeRect(
              x,
              y,
              prop.w *
                TILE_SIZE,
              prop.h *
                TILE_SIZE
            );
          }

          if (
            prop.type ===
            "door"
          ) {
            ctx.fillStyle =
              "#d8b34c";

            ctx.fillRect(
              x,
              y,
              prop.w *
                TILE_SIZE,
              prop.h *
                TILE_SIZE
            );
          }
        }
      );

      /*
       * Remote players
       */
      users.forEach(
        (user) => {
          if (
            currentUser &&
            user.userId ===
              currentUser.userId
          ) {
            return;
          }

          const x =
            user.x *
              TILE_SIZE +
            TILE_SIZE / 2;

          const y =
            user.y *
              TILE_SIZE +
            TILE_SIZE / 2;

          ctx.fillStyle =
            "#8b5cf6";

          ctx.beginPath();

          ctx.arc(
            x,
            y,
            14,
            0,
            Math.PI * 2
          );

          ctx.fill();

          ctx.fillStyle =
            "#ffffff";

          ctx.font =
            "12px sans-serif";

          ctx.textAlign =
            "center";

          ctx.fillText(
            user.username ||
              "Player",
            x,
            y - 22
          );
        }
      );

      /*
       * Current player
       */
      if (currentUser) {
        const x =
          currentUser.x *
            TILE_SIZE +
          TILE_SIZE / 2;

        const y =
          currentUser.y *
            TILE_SIZE +
          TILE_SIZE / 2;

        ctx.fillStyle =
          "#22d3ee";

        ctx.beginPath();

        ctx.arc(
          x,
          y,
          15,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle =
          "#ffffff";

        ctx.lineWidth = 2;

        ctx.stroke();

        ctx.fillStyle =
          "#ffffff";

        ctx.font =
          "bold 12px sans-serif";

        ctx.textAlign =
          "center";

        ctx.fillText(
          username,
          x,
          y - 24
        );
      }

      animationRef.current =
        requestAnimationFrame(
          draw
        );
    };

    draw();

    return () => {
      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, [
    users,
    currentUser,
    username,
  ]);

  /* =======================================================
     MOVEMENT
  ======================================================= */

  useEffect(() => {
    const interval =
      setInterval(() => {
        const ws =
          wsRef.current;

        if (
          !ws ||
          ws.readyState !==
            WebSocket.OPEN ||
          !currentUser
        ) {
          return;
        }

        const keys =
          keysRef.current;

        let dx = 0;
        let dy = 0;

        if (
          keys.has("w") ||
          keys.has("arrowup")
        ) {
          dy -= 1;
        }

        if (
          keys.has("s") ||
          keys.has("arrowdown")
        ) {
          dy += 1;
        }

        if (
          keys.has("a") ||
          keys.has("arrowleft")
        ) {
          dx -= 1;
        }

        if (
          keys.has("d") ||
          keys.has("arrowright")
        ) {
          dx += 1;
        }

        if (
          dx === 0 &&
          dy === 0
        ) {
          return;
        }

        const newX =
          currentUser.x + dx;

        const newY =
          currentUser.y + dy;

        if (
          newX < 0 ||
          newX > 39 ||
          newY < 0 ||
          newY > 23
        ) {
          return;
        }

        ws.send(
          JSON.stringify({
            type: "move",
            payload: {
              x: newX,
              y: newY,
            },
          })
        );

        setCurrentUser(
          (prev) =>
            prev
              ? {
                  ...prev,
                  x: newX,
                  y: newY,
                }
              : prev
        );
      }, 100);

    return () => {
      clearInterval(
        interval
      );
    };
  }, [
    currentUser,
  ]);

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "username"
    );

    onLogout();
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#070b0a] text-white">
      <header className="flex items-center justify-between border-b border-white/10 bg-[#08100f] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400">
            <Gamepad2
              size={24}
            />
          </div>

          <div>
            <h1 className="text-lg font-bold">
              MetaVerse
            </h1>

            <p className="text-xs text-white/50">
              Multiplayer virtual arena
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
              connected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {connected ? (
              <>
                <Wifi size={15} />
                Connected
              </>
            ) : (
              <>
                <WifiOff size={15} />
                Disconnected
              </>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-bold">
              {avatarLetter}
            </div>

            <span className="text-sm">
              {username}
            </span>
          </div>

          <button
            onClick={
              handleLogout
            }
            className="rounded-lg border border-white/10 p-3 text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut
              size={18}
            />
          </button>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-81px)] grid-cols-[1fr_360px]">
        <section className="relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="h-full min-h-[700px] w-full"
          />

          {error && (
            <div className="absolute left-1/2 top-8 -translate-x-1/2 rounded-xl border border-red-400/20 bg-red-500/20 px-6 py-3 text-sm text-red-300 backdrop-blur">
              {error}
            </div>
          )}

          {chatBubble && (
            <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded-xl border border-white/10 bg-black/70 px-5 py-3 text-sm backdrop-blur">
              <strong>
                {chatBubble.username}
              </strong>
              :{" "}
              {chatBubble.text}
            </div>
          )}

          <div className="absolute left-5 top-5 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur">
              <MapPin
                size={16}
              />

              Arena
            </div>

            <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs text-white/60 backdrop-blur">
              Space {SPACE_ID}
            </div>
          </div>

          <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur">
            <Keyboard
              size={17}
            />

            <span className="text-sm text-white/60">
              WASD / Arrow Keys
            </span>
          </div>
        </section>

        <aside className="border-l border-white/10 bg-[#0b1211] p-5">
          <div className="space-y-5">
            <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="border-b border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Your character
                    </h2>

                    <p className="mt-1 text-xs text-white/40">
                      Current player
                    </p>
                  </div>

                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      connected
                        ? "bg-emerald-400"
                        : "bg-red-400"
                    }`}
                  />
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-xl font-bold">
                    {avatarLetter}
                  </div>

                  <div>
                    <div className="font-semibold">
                      {username}
                    </div>

                    <div className="text-xs text-white/40">
                      {connected
                        ? "Connected"
                        : "Joining arena..."}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div className="flex items-center gap-2">
                  <Users
                    size={17}
                  />

                  <h2 className="font-semibold">
                    Players
                  </h2>
                </div>

                <span className="text-xs text-white/40">
                  {users.length} online
                </span>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto p-4">
                {currentUser && (
                  <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-bold">
                      {avatarLetter}
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {username}
                      </div>

                      <div className="text-xs text-emerald-400">
                        You
                      </div>
                    </div>

                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                )}

                {users
                  .filter(
                    (user) =>
                      !currentUser ||
                      user.userId !==
                        currentUser.userId
                  )
                  .map(
                    (user) => (
                      <div
                        key={
                          user.userId
                        }
                        className="flex items-center gap-3 rounded-xl p-3"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 text-sm font-bold text-violet-300">
                          {(
                            user.username ||
                            "P"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="flex-1 text-sm">
                          {user.username ||
                            "Player"}
                        </div>

                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                    )
                  )}

                {users.length === 0 && (
                  <div className="py-8 text-center text-sm text-white/30">
                    <Users
                      size={30}
                      className="mx-auto mb-3 opacity-50"
                    />

                    You're alone in the arena.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="border-b border-white/10 p-5">
                <div className="flex items-center gap-2">
                  <Keyboard
                    size={17}
                  />

                  <div>
                    <h2 className="font-semibold">
                      Controls
                    </h2>

                    <p className="mt-1 text-xs text-white/40">
                      Move around the world
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="mx-auto grid w-fit grid-cols-3 gap-2">
                  <div />

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm">
                    W
                  </div>

                  <div />

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm">
                    A
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm">
                    S
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm">
                    D
                  </div>
                </div>

                <p className="mt-4 text-center text-xs text-white/30">
                  Arrow keys work too
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3 p-5">
                <MessageCircle
                  size={18}
                />

                <div>
                  <h2 className="font-semibold">
                    Multiplayer session
                  </h2>

                  <p className="mt-1 text-xs text-white/40">
                    {connected
                      ? "Connected to game server"
                      : "Waiting for connection"}
                  </p>
                </div>
              </div>
            </section>

            <section className="relative">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <input
                  value={
                    messageInput
                  }
                  onChange={(event) =>
                    setMessageInput(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      sendMessage();
                    }
                  }}
                  placeholder="Talk to everyone..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-white/30"
                />

                <button
                  onClick={
                    sendMessage
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 transition hover:bg-violet-400"
                >
                  <Send
                    size={17}
                  />
                </button>
              </div>
            </section>

            <button
              onClick={
                handleLogout
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut
                size={17}
              />

              Log out of MetaVerse
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}