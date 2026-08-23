import { useEffect, useState } from "react";
import Arena from "./Game";
import Landing from "./Landing";
import Auth from "./Auth";
import "./App.css";

type Screen = "landing" | "signin" | "signup" | "game";

function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [authMessage, setAuthMessage] = useState("");

  /*
   * Check for an existing login when the app starts.
   */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setScreen("game");
    } else {
      setScreen("landing");
    }
  }, []);

  /*
   * Called after successful signup/signin.
   */
  const handleAuthSuccess = () => {
    setAuthMessage("");
    setScreen("game");
  };

  /*
   * Called when the user logs out from the game.
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    setAuthMessage("");
    setScreen("landing");
  };

  /*
   * Called when the game detects that the
   * authentication token is missing/invalid.
   */
  const handleGameAuthError = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    setAuthMessage(
      "You need to create an account for playing the game."
    );

    setScreen("signin");
  };

  /*
   * SIGN IN
   */
  if (screen === "signin") {
    return (
      <Auth
        mode="signin"
        onSuccess={handleAuthSuccess}
        onBack={() => {
          setAuthMessage("");
          setScreen("landing");
        }}
        message={authMessage}
      />
    );
  }

  /*
   * SIGN UP
   */
  if (screen === "signup") {
    return (
      <Auth
        mode="signup"
        onSuccess={handleAuthSuccess}
        onBack={() => {
          setAuthMessage("");
          setScreen("landing");
        }}
        message={authMessage}
      />
    );
  }

  /*
   * GAME
   */
  if (screen === "game") {
    return (
      <Arena
        onAuthError={handleGameAuthError}
        onLogout={handleLogout}
      />
    );
  }

  /*
   * LANDING PAGE
   */
  return (
    <Landing
      onSignIn={() => {
        setAuthMessage("");
        setScreen("signin");
      }}
      onSignUp={() => {
        setAuthMessage("");
        setScreen("signup");
      }}
    />
  );
}

export default App;