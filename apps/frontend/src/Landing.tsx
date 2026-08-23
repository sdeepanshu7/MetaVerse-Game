import {
  ArrowRight,
  Gamepad2,
  Globe2,
  Users,
  Zap,
} from "lucide-react";

type LandingProps = {
  onSignIn: () => void;
  onSignUp: () => void;
};

const Landing = ({ onSignIn, onSignUp }: LandingProps) => {
  return (
    <div className="app">
      {/* ================= NAVBAR ================= */}

      <header className="navbar">
        <div className="logo-container">
          <div className="logo-icon">
            <Gamepad2 size={20} />
          </div>

          <div>
            <div className="logo-text">MetaVerse</div>
            <div className="logo-subtitle">
              Shared virtual world
            </div>
          </div>
        </div>

        <div className="nav-actions">
          <button
            className="btn btn-ghost"
            onClick={onSignIn}
          >
            Sign in
          </button>

          <button
            className="btn btn-primary"
            onClick={onSignUp}
          >
            Get started
          </button>
        </div>
      </header>

      {/* ================= HERO ================= */}

      <main>
        <section className="hero">
          <div className="hero-content">

            {/* LEFT */}

            <div className="hero-left">

              <div className="status-badge">
                <span className="status-dot" />
                Multiplayer world is online
              </div>

              <h1 className="hero-title">
                Your world.
                <span className="hero-title-gradient">
                  Your people.
                </span>
              </h1>

              <p className="hero-description">
                Step into a shared virtual world, meet your
                friends and explore the arena together in
                real time.
              </p>

              <div className="hero-actions">
                <button
                  className="btn btn-primary hero-main-button"
                  onClick={onSignUp}
                >
                  Create your account
                  <ArrowRight
                    size={16}
                    style={{
                      marginLeft: 8,
                      display: "inline",
                    }}
                  />
                </button>

                <button
                  className="btn btn-ghost hero-secondary-button"
                  onClick={onSignIn}
                >
                  I already have an account
                </button>
              </div>

              <div className="hero-stats">

                <div className="stat">
                  <span className="stat-number">
                    Multiplayer
                  </span>

                  <span className="stat-label">
                    Play with friends
                  </span>
                </div>

                <div className="stat-divider" />

                <div className="stat">
                  <span className="stat-number">
                    Shared world
                  </span>

                  <span className="stat-label">
                    One arena, everyone together
                  </span>
                </div>

                <div className="stat-divider" />

                <div className="stat">
                  <span className="stat-number">
                    Real-time
                  </span>

                  <span className="stat-label">
                    Instant player movement
                  </span>
                </div>

              </div>
            </div>

            {/* RIGHT */}

            <div className="hero-visual">

              <div className="world-preview">

                <div className="world-grid" />

                <div className="world-glow" />

                {/* Buildings */}

                <div className="building building-one" />

                <div className="building building-two" />

                <div className="building building-three" />

                {/* Player 1 */}

                <div className="avatar avatar-one">
                  <span className="avatar-label">
                    You
                  </span>
                </div>

                {/* Player 2 */}

                <div className="avatar avatar-two">
                  <span className="avatar-label">
                    Alex
                  </span>
                </div>

                {/* Player 3 */}

                <div className="avatar avatar-three">
                  <span className="avatar-label">
                    Sam
                  </span>
                </div>

                {/* Online card */}

                <div className="floating-card online-card">

                  <div className="floating-card-title">
                    <span
                      style={{
                        color: "#22c55e",
                        marginRight: 6,
                      }}
                    >
                      ●
                    </span>

                    World online
                  </div>

                  <div className="floating-card-text">
                    Players can join now
                  </div>

                </div>

                {/* Friend card */}

                <div className="floating-card friend-card">

                  <div className="floating-card-title">
                    <Users
                      size={12}
                      style={{
                        display: "inline",
                        marginRight: 5,
                      }}
                    />

                    Friends online
                  </div>

                  <div className="floating-card-text">
                    Meet inside the arena
                  </div>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ================= FEATURES ================= */}

        <section className="features">

          <div className="features-inner">

            <div className="section-heading">

              <div className="section-eyebrow">
                Built for shared experiences
              </div>

              <h2 className="section-title">
                A small world with real players.
              </h2>

              <p className="section-description">
                Sign in, enter the same space and start
                exploring together. Your movements are
                synchronized in real time.
              </p>

            </div>

            <div className="feature-grid">

              <div className="feature-card">

                <div className="feature-icon">
                  <Users size={20} />
                </div>

                <div className="feature-title">
                  Multiplayer
                </div>

                <div className="feature-text">
                  See other players inside the same virtual
                  space and move around together.
                </div>

              </div>

              <div className="feature-card">

                <div className="feature-icon">
                  <Globe2 size={20} />
                </div>

                <div className="feature-title">
                  Shared world
                </div>

                <div className="feature-text">
                  Everyone enters the same arena instead of
                  playing inside an isolated session.
                </div>

              </div>

              <div className="feature-card">

                <div className="feature-icon">
                  <Zap size={20} />
                </div>

                <div className="feature-title">
                  Real-time movement
                </div>

                <div className="feature-text">
                  WebSockets keep player positions synchronized
                  while you explore the world.
                </div>

              </div>

            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}

      <footer className="footer">
        MetaVerse · A shared multiplayer experiment
      </footer>
    </div>
  );
};

export default Landing;