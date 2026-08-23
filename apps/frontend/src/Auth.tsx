import { type FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Gamepad2,
  Lock,
  User,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

type AuthProps = {
  mode: "signin" | "signup";
  onSuccess: () => void;
  onBack: () => void;
  message?: string;
};

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3004";

export default function Auth({
  mode,
  onSuccess,
  onBack,
  message,
}: AuthProps) {
  const isSignup = mode === "signup";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");

    const cleanUsername = username.trim();

    /*
     * ============================
     * FRONTEND VALIDATION
     * ============================
     */

    if (!cleanUsername) {
      setError("Please enter a username.");
      return;
    }

    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (isSignup && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      /*
       * ==================================================
       * SIGNUP
       * ==================================================
       */

      if (isSignup) {
        const signupResponse = await fetch(
          `${API_URL}/api/v1/signup`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: cleanUsername,
              password,
              type: "user",
            }),
          }
        );

        let signupData: any = {};

        try {
          signupData = await signupResponse.json();
        } catch {
          signupData = {};
        }

        /*
         * Signup failed
         */

        if (!signupResponse.ok) {
          throw new Error(
            signupData.message ||
              signupData.error ||
              "Unable to create your account."
          );
        }

        /*
         * Signup succeeded.
         *
         * Your backend currently returns userId,
         * not the JWT.
         *
         * So we immediately sign the new user in.
         */

        const signinResponse = await fetch(
          `${API_URL}/api/v1/signin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: cleanUsername,
              password,
            }),
          }
        );

        let signinData: any = {};

        try {
          signinData = await signinResponse.json();
        } catch {
          signinData = {};
        }

        /*
         * Automatic signin failed
         */

        if (!signinResponse.ok) {
          throw new Error(
            signinData.message ||
              signinData.error ||
              "Account created, but automatic login failed."
          );
        }

        /*
         * We NEED a JWT for the game.
         */

        if (!signinData.token) {
          throw new Error(
            "Account created, but the server did not return a login token."
          );
        }

        /*
         * Save everything needed by the game.
         */

        localStorage.setItem(
          "token",
          signinData.token
        );

        localStorage.setItem(
          "username",
          cleanUsername
        );

        if (signupData.userId) {
          localStorage.setItem(
            "userId",
            signupData.userId
          );
        }

        /*
         * Enter the game.
         */

        onSuccess();

        return;
      }

      /*
       * ==================================================
       * SIGN IN
       * ==================================================
       */

      const response = await fetch(
        `${API_URL}/api/v1/signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: cleanUsername,
            password,
          }),
        }
      );

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      /*
       * Login failed
       */

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Invalid username or password."
        );
      }

      /*
       * JWT is required to enter the game.
       */

      if (!data.token) {
        throw new Error(
          "Login succeeded, but the server did not return a login token."
        );
      }

      /*
       * Save authentication.
       */

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "username",
        cleanUsername
      );

      if (data.userId) {
        localStorage.setItem(
          "userId",
          data.userId
        );
      }

      /*
       * Enter game.
       */

      onSuccess();
    } catch (err) {
      console.error("Authentication error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="auth-background">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
        <div className="auth-grid" />
      </div>

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="auth-navbar">

        <button
          className="auth-back"
          onClick={onBack}
          type="button"
          disabled={loading}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="auth-brand">

          <div className="auth-brand-icon">
            <Gamepad2 size={20} />
          </div>

          <div>
            <div className="auth-brand-name">
              MetaVerse
            </div>

            <div className="auth-brand-subtitle">
              Shared virtual world
            </div>
          </div>

        </div>

        <div className="auth-nav-status">
          <span />
          World online
        </div>

      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="auth-main">

        {/* =================================================
            LEFT SIDE
        ================================================== */}

        <section className="auth-visual">

          <div className="auth-badge">
            <Sparkles size={14} />
            Enter the world
          </div>

          <h1>
            Your world
            <br />
            <span>starts here.</span>
          </h1>

          <p>
            Create your identity and step into a shared
            virtual space where you can meet friends,
            explore and play together in real time.
          </p>

          <div className="auth-feature-list">

            <div className="auth-feature">

              <div className="auth-feature-icon">
                <UsersIcon />
              </div>

              <div>
                <strong>
                  Meet your people
                </strong>

                <span>
                  See your friends appear in your world.
                </span>
              </div>

            </div>

            <div className="auth-feature">

              <div className="auth-feature-icon">
                <ShieldCheck size={17} />
              </div>

              <div>
                <strong>
                  Your own identity
                </strong>

                <span>
                  One account, one player.
                </span>
              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            AUTH CARD
        ================================================== */}

        <section className="auth-card">

          <div className="auth-card-icon">
            <Gamepad2 size={22} />
          </div>

          <div className="auth-card-heading">

            <h2>
              {isSignup
                ? "Create your player"
                : "Welcome back"}
            </h2>

            <p>
              {isSignup
                ? "Create your account and enter the world."
                : "Sign in to continue your adventure."}
            </p>

          </div>

          {/* APP MESSAGE */}

          {message && (
            <div className="auth-message">
              <ShieldCheck size={16} />
              <span>{message}</span>
            </div>
          )}

          {/* FORM */}

          <form onSubmit={handleSubmit}>

            {/* USERNAME */}

            <div className="auth-field">

              <label htmlFor="username">
                Username
              </label>

              <div className="auth-input-wrapper">

                <User size={17} />

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  placeholder="Enter your username"
                  autoComplete="username"
                  disabled={loading}
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="auth-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="auth-input-wrapper">

                <Lock size={17} />

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete={
                    isSignup
                      ? "new-password"
                      : "current-password"
                  }
                  disabled={loading}
                />

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            {isSignup && (
              <div className="auth-field">

                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <div className="auth-input-wrapper">

                  <Lock size={17} />

                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={loading}
                  />

                </div>

              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="auth-error">
                <span>!</span>
                {error}
              </div>
            )}

            {/* SUBMIT */}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >

              {loading ? (
                <span className="auth-loading">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <>
                  {isSignup
                    ? "Create account"
                    : "Sign in"}

                  <ArrowRight size={17} />
                </>
              )}

            </button>

          </form>

          {/* FOOTER */}

          <div className="auth-divider">
            <span />

            <p>
              {isSignup
                ? "Your journey starts here."
                : "Ready to enter the world?"}
            </p>

            <span />
          </div>

        </section>

      </main>

    </div>
  );
}

/* =========================================================
   USERS ICON
========================================================= */

function UsersIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

      <circle
        cx="9"
        cy="7"
        r="4"
      />

      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />

      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}