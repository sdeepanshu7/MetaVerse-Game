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
    type: "rug",
    x: 1,
    y: 4,
    w: 5,
    h: 5,
  },

  {
    type: "table",
    x: 2,
    y: 6,
    w: 3,
    h: 3,
  },

  {
    type: "sofa",
    x: 1,
    y: 11,
    w: 4,
    h: 2,
  },

  {
    type: "plant",
    x: 6,
    y: 13,
  },

  {
    type: "painting",
    x: 2,
    y: 4,
    w: 3,
    h: 1,
  },

  {
    type: "bookshelf",
    x: 31,
    y: 4,
    w: 2,
    h: 4,
  },

  {
    type: "bookshelf",
    x: 37,
    y: 4,
    w: 2,
    h: 4,
  },

  {
    type: "sofa",
    x: 33,
    y: 12,
    w: 4,
    h: 2,
  },

  {
    type: "plant",
    x: 31,
    y: 13,
  },

  {
    type: "plant",
    x: 37,
    y: 9,
  },
];

const ZONE_LABELS = [
  {
    text: "Sleeping Room",
    x: 20,
    y: 8,
    arrow: "up" as const,
  },
  {
    text: "Personal Desk",
    x: 20,
    y: 15,
    arrow: "down" as const,
  },
];

const AVATAR_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#f2a13c",
  "#e07a5f",
  "#81b29a",
  "#8ab6d6",
];

function colorForId(id: string) {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash =
      (hash * 31 + id.charCodeAt(i)) >>> 0;
  }

  return AVATAR_COLORS[
    hash % AVATAR_COLORS.length
  ];
}

/* =========================================================
   ARENA
========================================================= */

const Arena = ({
  onAuthError,
  onLogout,
}: ArenaProps) => {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const wsRef =
    useRef<WebSocket | null>(null);

  const bubbleTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const chatIdRef =
    useRef(0);

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [users, setUsers] =
    useState<Map<string, User>>(
      new Map()
    );

  const [connected, setConnected] =
    useState(false);

  const [chatLog, setChatLog] =
    useState<ChatMessage[]>([]);

  const [chatDraft, setChatDraft] =
    useState("");

  const [bubble, setBubble] =
    useState<string | null>(null);

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
      /* ---------------------------------------------------
         SUCCESSFUL JOIN
      --------------------------------------------------- */

      case "space-joined": {
        const payload =
          message.payload;

        if (!payload) {
          return;
        }

        setCurrentUser({
          x: payload.spawn?.x ?? 10,
          y: payload.spawn?.y ?? 10,
          userId: payload.userId,
        });

        const userMap =
          new Map<string, User>();

        if (Array.isArray(payload.users)) {
          payload.users.forEach(
            (user: User) => {
              /*
               * Don't put ourselves in the
               * "other players" map.
               */
              if (
                user.userId !==
                payload.userId
              ) {
                userMap.set(
                  user.userId,
                  user
                );
              }
            }
          );
        }

        setUsers(userMap);

        break;
      }

      /* ---------------------------------------------------
         PLAYER JOINED
      --------------------------------------------------- */

      case "user-joined": {
        const user =
          message.payload;

        if (!user?.userId) {
          return;
        }

        setUsers((previous) => {
          const next =
            new Map(previous);

          next.set(
            user.userId,
            {
              x: user.x,
              y: user.y,
              userId: user.userId,
              username:
                user.username,
            }
          );

          return next;
        });

        break;
      }

      /* ---------------------------------------------------
         PLAYER MOVEMENT
      --------------------------------------------------- */

      case "movement": {
        const payload =
          message.payload;

        if (!payload?.userId) {
          return;
        }

        setUsers((previous) => {
          const next =
            new Map(previous);

          const existing =
            next.get(
              payload.userId
            );

          if (existing) {
            next.set(
              payload.userId,
              {
                ...existing,
                x: payload.x,
                y: payload.y,
              }
            );
          } else {
            /*
             * Handles a movement message
             * arriving before user-joined.
             */
            next.set(
              payload.userId,
              {
                x: payload.x,
                y: payload.y,
                userId:
                  payload.userId,
              }
            );
          }

          return next;
        });

        break;
      }

      /* ---------------------------------------------------
         MOVEMENT REJECTED
      --------------------------------------------------- */

      case "movement-rejected": {
        const payload =
          message.payload;

        if (!payload) {
          return;
        }

        setCurrentUser(
          (previous) => {
            if (!previous) {
              return previous;
            }

            return {
              ...previous,
              x: payload.x,
              y: payload.y,
            };
          }
        );

        break;
      }

      /* ---------------------------------------------------
         PLAYER LEFT
      --------------------------------------------------- */

      case "user-left": {
        const userId =
          message.payload?.userId;

        if (!userId) {
          return;
        }

        setUsers((previous) => {
          const next =
            new Map(previous);

          next.delete(userId);

          return next;
        });

        break;
      }

      /* ---------------------------------------------------
         CHAT
      --------------------------------------------------- */

      case "chat": {
        const payload =
          message.payload;

        if (!payload?.text) {
          return;
        }

        setChatLog(
          (previous) => [
            ...previous,
            {
              id:
                chatIdRef.current++,
              name:
                payload.name ||
                payload.username ||
                `Player ${String(
                  payload.userId
                ).slice(0, 6)}`,
              text:
                payload.text,
            },
          ]
        );

        break;
      }

      /* ---------------------------------------------------
         AUTH ERROR
      --------------------------------------------------- */

      case "unauthorized":
      case "auth-error":
      case "invalid-token": {
        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "username"
        );

        setConnected(false);

        onAuthError();

        break;
      }

      default: {
        console.log(
          "Unknown WebSocket message:",
          message
        );
      }
    }
  };

  /* =======================================================
     MOVEMENT
  ======================================================= */

  const handleMove = (
    newX: number,
    newY: number
  ) => {
    if (!currentUser) {
      return;
    }

    const ws =
      wsRef.current;

    if (
      !ws ||
      ws.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "move",

        payload: {
          x: newX,
          y: newY,
          userId:
            currentUser.userId,
        },
      })
    );
  };

  /* =======================================================
     KEYBOARD
  ======================================================= */

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (!currentUser) {
        return;
      }

      const target =
        event.target as HTMLElement | null;

      /*
       * Don't move while typing.
       */
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const {
        x,
        y,
      } = currentUser;

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          event.preventDefault();
          handleMove(x, y - 1);
          break;

        case "ArrowDown":
        case "s":
        case "S":
          event.preventDefault();
          handleMove(x, y + 1);
          break;

        case "ArrowLeft":
        case "a":
        case "A":
          event.preventDefault();
          handleMove(x - 1, y);
          break;

        case "ArrowRight":
        case "d":
        case "D":
          event.preventDefault();
          handleMove(x + 1, y);
          break;
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [currentUser]);

  /* =======================================================
     CHAT
  ======================================================= */

  const sendChatMessage = () => {
    const text =
      chatDraft.trim();

    if (
      !text ||
      !currentUser
    ) {
      return;
    }

    /*
     * Show immediately for ourselves.
     */
    setChatLog(
      (previous) => [
        ...previous,
        {
          id:
            chatIdRef.current++,
          name: username,
          text,
        },
      ]
    );

    /*
     * Show bubble above avatar.
     */
    setBubble(text);

    if (bubbleTimeout.current) {
      clearTimeout(
        bubbleTimeout.current
      );
    }

    bubbleTimeout.current =
      setTimeout(() => {
        setBubble(null);
      }, 3200);

    /*
     * Broadcast to server.
     */
    const ws =
      wsRef.current;

    if (
      ws &&
      ws.readyState ===
        WebSocket.OPEN
    ) {
      ws.send(
        JSON.stringify({
          type: "chat",

          payload: {
            userId:
              currentUser.userId,
            username,
            name: username,
            text,
          },
        })
      );
    }

    setChatDraft("");
  };

  /* =======================================================
     CANVAS RENDER
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

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    drawFloor(
      ctx,
      canvas.width,
      canvas.height
    );

    drawProps(ctx);

    drawZoneLabels(ctx);

    /*
     * Other players.
     */
    users.forEach(
      (user) => {
        const px =
          user.x *
            TILE_SIZE +
          TILE_SIZE / 2;

        const py =
          user.y *
            TILE_SIZE +
          TILE_SIZE / 2;

        const playerName =
          user.username ||
          `Player ${user.userId.slice(
            0,
            6
          )}`;

        drawPlayer(
          ctx,
          px,
          py,
          colorForId(
            user.userId
          ),
          playerName
        );
      }
    );

    /*
     * Current player.
     */
    if (currentUser) {
      const px =
        currentUser.x *
          TILE_SIZE +
        TILE_SIZE / 2;

      const py =
        currentUser.y *
          TILE_SIZE +
        TILE_SIZE / 2;

      drawPlayer(
        ctx,
        px,
        py,
        "#d4c04a",
        username,
        bubble
      );
    }
  }, [
    currentUser,
    users,
    bubble,
    username,
  ]);

  /* =======================================================
     DRAW FLOOR
  ======================================================= */

  const t = (n: number) =>
    n * TILE_SIZE;

  const drawFloor = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    /*
     * Base floor.
     */
    for (
      let y = 0;
      y < height;
      y += TILE_SIZE
    ) {
      for (
        let x = 0;
        x < width;
        x += TILE_SIZE
      ) {
        const dark =
          (x / TILE_SIZE +
            y / TILE_SIZE) %
            2 ===
          0;

        ctx.fillStyle = dark
          ? "#2f8f7f"
          : "#297a6c";

        ctx.fillRect(
          x,
          y,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }

    /*
     * Back room.
     */
    ctx.fillStyle =
      "#7a3c33";

    ctx.fillRect(
      t(BACK_ROOM.x),
      t(BACK_ROOM.y),
      t(BACK_ROOM.w),
      t(BACK_ROOM.h)
    );

    /*
     * Side rooms.
     */
    [LEFT_ROOM, RIGHT_ROOM].forEach(
      (room) => {
        ctx.fillStyle =
          "#7a4a30";

        ctx.fillRect(
          t(room.x),
          t(room.y),
          t(room.w),
          t(room.h)
        );

        ctx.strokeStyle =
          "#6e4128";

        ctx.lineWidth = 1;

        for (
          let x = t(room.x);
          x <
          t(
            room.x +
              room.w
          );
          x += 14
        ) {
          ctx.beginPath();

          ctx.moveTo(
            x,
            t(room.y)
          );

          ctx.lineTo(
            x,
            t(
              room.y +
                room.h
            )
          );

          ctx.stroke();
        }
      }
    );

    /*
     * Stairs.
     */
    [STAIRS_LEFT, STAIRS_RIGHT].forEach(
      (room) => {
        ctx.fillStyle =
          "#5c3620";

        ctx.fillRect(
          t(room.x),
          t(room.y),
          t(room.w),
          t(room.h)
        );

        ctx.strokeStyle =
          "#3d281a";

        ctx.lineWidth = 2;

        for (
          let i = -room.h;
          i < room.w;
          i++
        ) {
          ctx.beginPath();

          ctx.moveTo(
            t(room.x) +
              i * TILE_SIZE,
            t(room.y)
          );

          ctx.lineTo(
            t(room.x) +
              (i +
                room.h) *
                TILE_SIZE,
            t(
              room.y +
                room.h
            )
          );

          ctx.stroke();
        }
      }
    );
  };

  /* =======================================================
     DRAW PROPS
  ======================================================= */

  const drawProps = (
    ctx: CanvasRenderingContext2D
  ) => {
    PROPS.forEach(
      (p) => {
        switch (p.type) {
          case "door": {
            ctx.fillStyle =
              "#c94f3d";

            ctx.fillRect(
              t(p.x),
              t(p.y),
              t(p.w),
              t(p.h)
            );

            ctx.fillStyle =
              "#f2c14e";

            ctx.fillRect(
              t(p.x),
              t(p.y),
              t(p.w),
              6
            );

            break;
          }

          case "kiosk": {
            ctx.fillStyle =
              p.color;

            ctx.fillRect(
              t(p.x),
              t(p.y),
              t(p.w),
              t(p.h)
            );

            ctx.strokeStyle =
              "#f5f1e6";

            ctx.lineWidth = 2;

            ctx.strokeRect(
              t(p.x),
              t(p.y),
              t(p.w),
              t(p.h)
            );

            ctx.fillStyle =
              "#f5f1e6";

            ctx.font =
              "700 11px Inter, Arial";

            ctx.textAlign =
              "center";

            ctx.fillText(
              p.label,
              t(p.x) +
                t(p.w) / 2,
              t(p.y) +
                t(p.h) / 2 +
                4
            );

            break;
          }

          case "bookshelf": {
            ctx.fillStyle =
              "#4a2f1c";

            ctx.fillRect(
              t(p.x),
              t(p.y),
              t(p.w),
              t(p.h)
            );

            const rows = 3;
            const cols = 4;

            const cellW =
              t(p.w) / cols;

            const cellH =
              t(p.h) / rows;

            const bookColors = [
              "#c94f3d",
              "#3b6fb3",
              "#81b29a",
              "#f2c14e",
            ];

            for (
              let r = 0;
              r < rows;
              r++
            ) {
              for (
                let c = 0;
                c < cols;
                c++
              ) {
                ctx.fillStyle =
                  bookColors[
                    (r + c) %
                      bookColors.length
                  ];

                ctx.fillRect(
                  t(p.x) +
                    c *
                      cellW +
                    1,
                  t(p.y) +
                    r *
                      cellH +
                    1,
                  cellW - 2,
                  cellH - 2
                );
              }
            }

            break;
          }

          case "plant": {
            const cx =
              t(p.x) +
              TILE_SIZE / 2;

            const cy =
              t(p.y) +
              TILE_SIZE / 2;

            ctx.fillStyle =
              "#5c3620";

            ctx.fillRect(
              cx - 8,
              cy + 4,
              16,
              12
            );

            ctx.fillStyle =
              "#3d7a4a";

            ctx.beginPath();

            ctx.ellipse(
              cx,
              cy - 2,
              14,
              12,
              0,
              0,
              Math.PI * 2
            );

            ctx.fill();

            break;
          }

          case "table": {
            ctx.fillStyle =
              "#c9a876";

            ctx.fillRect(
              t(p.x),
              t(p.y),
              t(p.w),
              t(p.h)
            );

            ctx.strokeStyle =
              "#8a6a44";

            ctx.lineWidth = 2;

            ctx.strokeRect(
              t(p.x),
              t(p.y),
              t(p.w),
              t(p.h)
            );

            break;
          }

          case "sofa": {
            ctx.fillStyle =
              "#d4a94a";

            ctx.fillRect(
              t(p.x),
              t(p.y),
              t(p.w),
              t(p.h)
            );

            ctx.fillStyle =
              "#b8902f";

            ctx.fillRect(
              t(p.x),
              t(p.y) +
                t(p.h) -
                6,
              t(p.w),
              6
            );

            break;
          }

          case "rug": {
            ctx.fillStyle =
              "#b5432f";

            ctx.fillRect(
              t(p.x),
              t(p.y),
              t(p.w),
              t(p.h)
            );

            ctx.strokeStyle =
              "#8a2f20";

            ctx.lineWidth = 3;

            ctx.strokeRect(
              t(p.x) + 2,
              t(p.y) + 2,
              t(p.w) - 4,
              t(p.h) - 4
            );

            break;
          }

          case "painting": {
            ctx.fillStyle =
              "#e8dfc8";

            ctx.fillRect(
              t(p.x),
              t(p.y),
              t(p.w),
              t(p.h)
            );

            ctx.strokeStyle =
              "#6e4128";

            ctx.lineWidth = 3;

            ctx.strokeRect(
              t(p.x),
              t(p.y),
              t(p.w),
              t(p.h)
            );

            break;
          }
        }
      }
    );
  };

  /* =======================================================
     ZONE LABELS
  ======================================================= */

  const drawZoneLabels = (
    ctx: CanvasRenderingContext2D
  ) => {
    ctx.textAlign =
      "center";

    ctx.fillStyle =
      "#e8f5ef";

    ctx.font =
      "700 13px Inter, Arial";

    ZONE_LABELS.forEach(
      (zone) => {
        const cx =
          t(zone.x);

        const cy =
          t(zone.y);

        ctx.fillText(
          zone.arrow === "up"
            ? "▲"
            : "▼",
          cx,
          zone.arrow === "up"
            ? cy - 14
            : cy + 20
        );

        ctx.fillText(
          zone.text,
          cx,
          cy
        );
      }
    );
  };

  /* =======================================================
     PLAYER
  ======================================================= */

  const drawPlayer = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    label: string,
    chatBubble?: string | null
  ) => {
    /*
     * Glow.
     */
    ctx.save();

    ctx.shadowColor =
      color;

    ctx.shadowBlur = 18;

    ctx.beginPath();

    ctx.fillStyle =
      color;

    ctx.arc(
      x,
      y,
      15,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    /*
     * Body.
     */
    ctx.beginPath();

    ctx.fillStyle =
      color;

    ctx.arc(
      x,
      y,
      13,
      0,
      Math.PI * 2
    );

    ctx.fill();

    /*
     * Head.
     */
    ctx.beginPath();

    ctx.fillStyle =
      "#f4f4f5";

    ctx.arc(
      x,
      y - 5,
      5,
      0,
      Math.PI * 2
    );

    ctx.fill();

    /*
     * Name plate.
     */
    ctx.font =
      "600 11px Inter, Arial";

    ctx.textAlign =
      "center";

    const labelWidth =
      ctx.measureText(
        label
      ).width + 16;

    ctx.fillStyle =
      "#0e1512dd";

    ctx.fillRect(
      x -
        labelWidth / 2,
      y + 20,
      labelWidth,
      17
    );

    ctx.fillStyle =
      "#ffffff";

    ctx.fillText(
      label,
      x,
      y + 32
    );

    /*
     * Chat bubble.
     */
    if (chatBubble) {
      ctx.font =
        "600 12px Inter, Arial";

      const bubbleWidth =
        Math.min(
          180,
          ctx.measureText(
            chatBubble
          ).width + 24
        );

      const bubbleX =
        x -
        bubbleWidth / 2;

      const bubbleY =
        y - 48;

      ctx.fillStyle =
        "#fffdf7";

      ctx.beginPath();

      ctx.roundRect(
        bubbleX,
        bubbleY,
        bubbleWidth,
        28,
        8
      );

      ctx.fill();

      ctx.fillStyle =
        "#1e1508";

      ctx.fillText(
        chatBubble,
        x,
        bubbleY + 18,
        bubbleWidth - 10
      );
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen w-full bg-[#080c0b] text-white overflow-hidden">
      {/* HEADER */}

      <header className="h-16 w-full border-b border-white/10 bg-[#0c1210]/95 backdrop-blur-xl flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Gamepad2 size={20} />
          </div>

          <div>
            <h1 className="text-sm md:text-base font-semibold">
              MetaVerse
            </h1>

            <p className="text-[10px] md:text-xs text-zinc-500">
              Multiplayer virtual arena
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            {connected ? (
              <Wifi
                size={13}
                className="text-emerald-400"
              />
            ) : (
              <WifiOff
                size={13}
                className="text-red-400"
              />
            )}

            <span
              className={`text-xs ${
                connected
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {connected
                ? "Connected"
                : "Disconnected"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold">
              {avatarLetter}
            </div>

            <span className="hidden md:block text-xs text-zinc-300">
              {username}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center transition"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* MAIN */}

      <main className="h-[calc(100vh-4rem)] w-full flex flex-col lg:flex-row">
        {/* WORLD */}

        <section className="relative flex-1 min-w-0 min-h-0 bg-[#0b100e] overflow-hidden">
          {/* World info */}

          <div className="absolute z-20 top-4 left-4 flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c1210]/85 backdrop-blur-xl px-3 py-2 shadow-xl">
              <MapPin
                size={14}
                className="text-cyan-400"
              />

              <span className="text-xs font-medium text-zinc-200">
                Arena
              </span>
            </div>

            <div className="hidden sm:flex items-center rounded-xl border border-white/10 bg-[#0c1210]/85 backdrop-blur-xl px-3 py-2">
              <span className="text-[11px] text-zinc-500 mr-1">
                Space
              </span>

              <span className="text-[11px] text-zinc-300 font-mono">
                {SPACE_ID.slice(0, 12)}
              </span>
            </div>
          </div>

          {/* Error */}

          {error && (
            <div className="absolute z-30 top-20 left-1/2 -translate-x-1/2">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-4 py-3 text-xs text-red-300 shadow-xl">
                {error}
              </div>
            </div>
          )}

          {/* Canvas */}

          <div className="absolute inset-0 overflow-auto">
            <canvas
              ref={canvasRef}
              width={2000}
              height={1200}
              className="block max-w-none"
            />
          </div>

          {/* CHAT */}

          <div className="absolute z-30 bottom-4 left-4 w-[min(340px,calc(100%-2rem))]">
            {chatLog.length > 0 && (
              <div className="mb-2 max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {chatLog
                  .slice(-5)
                  .map((message) => (
                    <div
                      key={message.id}
                      className="w-fit max-w-full rounded-xl border border-white/10 bg-[#0c1210]/90 backdrop-blur-xl px-3 py-1.5"
                    >
                      <span className="text-[11px] font-semibold text-cyan-300">
                        {message.name}
                      </span>

                      <span className="ml-2 text-[11px] text-zinc-300 break-words">
                        {message.text}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0c1210]/95 backdrop-blur-xl p-1.5 shadow-2xl">
              <MessageCircle
                size={15}
                className="ml-2 text-zinc-500"
              />

              <input
                value={chatDraft}
                onChange={(event) =>
                  setChatDraft(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    sendChatMessage();
                  }
                }}
                placeholder="Talk to everyone..."
                className="flex-1 min-w-0 bg-transparent outline-none border-none text-xs text-white placeholder:text-zinc-600 px-1 py-2"
              />

              <button
                onClick={
                  sendChatMessage
                }
                disabled={
                  !chatDraft.trim() ||
                  !currentUser
                }
                className="h-8 w-8 shrink-0 rounded-xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 disabled:opacity-30 transition"
              >
                <Send size={13} />
              </button>
            </div>
          </div>

          {/* Controls */}

          <div className="absolute z-20 bottom-4 right-4 hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c1210]/85 backdrop-blur-xl px-3 py-2">
            <Keyboard
              size={13}
              className="text-zinc-500"
            />

            <span className="text-[10px] text-zinc-500">
              WASD / Arrow Keys
            </span>
          </div>
        </section>

        {/* SIDEBAR */}

        <aside className="w-full lg:w-[320px] xl:w-[350px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0c1210] overflow-y-auto">
          <div className="p-4 space-y-3">
            {/* CHARACTER */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-semibold">
                      Your character
                    </h2>

                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      Current player
                    </p>
                  </div>

                  <div
                    className={`h-2 w-2 rounded-full ${
                      connected
                        ? "bg-emerald-400 shadow-lg shadow-emerald-400/50"
                        : "bg-red-400"
                    }`}
                  />
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-lg font-bold shadow-lg">
                    {avatarLetter}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {username}
                    </div>

                    <div className="text-[10px] text-zinc-600 mt-1">
                      {currentUser
                        ? `Position ${currentUser.x}, ${currentUser.y}`
                        : "Joining arena..."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PLAYERS */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users
                      size={14}
                      className="text-violet-400"
                    />

                    <h2 className="text-xs font-semibold">
                      Players
                    </h2>
                  </div>

                  <span className="text-[10px] text-zinc-600">
                    {users.size +
                      (currentUser
                        ? 1
                        : 0)}{" "}
                    online
                  </span>
                </div>
              </div>

              <div className="p-3">
                <div className="space-y-1">
                  {/* CURRENT USER */}

                  <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-[9px] font-bold">
                      {avatarLetter}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {username}
                      </div>

                      <div className="text-[9px] text-emerald-400">
                        You
                      </div>
                    </div>

                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>

                  {/* OTHER USERS */}

                  {Array.from(
                    users.values()
                  ).map((user) => {
                    const name =
                      user.username ||
                      `Player ${user.userId.slice(
                        0,
                        6
                      )}`;

                    return (
                      <div
                        key={user.userId}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.03] transition"
                      >
                        <div
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold"
                          style={{
                            background:
                              colorForId(
                                user.userId
                              ),
                          }}
                        >
                          {name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-zinc-300 truncate">
                            {name}
                          </div>

                          <div className="text-[9px] text-zinc-600">
                            {user.x},{" "}
                            {user.y}
                          </div>
                        </div>

                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </div>
                    );
                  })}

                  {users.size === 0 && (
                    <div className="py-5 text-center">
                      <Users
                        size={20}
                        className="mx-auto text-zinc-700 mb-2"
                      />

                      <p className="text-[10px] text-zinc-600">
                        You're alone in
                        the arena.
                      </p>

                      <p className="text-[9px] text-zinc-700 mt-1">
                        Invite a friend
                        to join you.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CONTROLS */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Keyboard
                    size={14}
                    className="text-cyan-400"
                  />

                  <h2 className="text-xs font-semibold">
                    Controls
                  </h2>
                </div>

                <p className="text-[10px] text-zinc-600 mt-1">
                  Move around the world
                </p>
              </div>

              <div className="p-4">
                <div className="flex justify-center mb-2">
                  <div className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center text-xs font-semibold">
                    W
                  </div>
                </div>

                <div className="flex justify-center gap-1">
                  {["A", "S", "D"].map(
                    (key) => (
                      <div
                        key={key}
                        className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center text-xs font-semibold"
                      >
                        {key}
                      </div>
                    )
                  )}
                </div>

                <p className="text-center text-[9px] text-zinc-700 mt-3">
                  Arrow keys work too
                </p>
              </div>
            </div>

            {/* SESSION */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                    connected
                      ? "bg-emerald-500/10"
                      : "bg-red-500/10"
                  }`}
                >
                  {connected ? (
                    <Wifi
                      size={14}
                      className="text-emerald-400"
                    />
                  ) : (
                    <WifiOff
                      size={14}
                      className="text-red-400"
                    />
                  )}
                </div>

                <div>
                  <div className="text-xs font-medium">
                    Multiplayer session
                  </div>

                  <div className="text-[9px] text-zinc-600 mt-0.5">
                    {connected
                      ? "Everything is synced"
                      : "Waiting for connection"}
                  </div>
                </div>
              </div>
            </div>

            {/* LOGOUT */}

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.025] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 px-4 py-3 text-xs text-zinc-400 transition"
            >
              <LogOut size={14} />

              Log out of MetaVerse
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Arena;