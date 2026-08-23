import { useState, useEffect } from "react";
import { supabase } from "./supabase"; // Supabase import kiya
import { learnTopic } from "./api";

import Lesson from "./components/Lesson";
import KeyConcepts from "./components/KeyConcepts";
import Quiz from "./components/Quiz";
import History from "./components/History";
import Progress from "./components/Progress";

import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  
  // Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [theme, setTheme] = useState("light");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("simple");
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Supabase Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  // ----------------------------------------------------
  // AUTHENTICATION LOGIC
  // ----------------------------------------------------
  async function handleAuth(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");

    if (isLoginView) {
      // SIGN IN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setAuthError(error.message);
    } else {
      // SIGN UP (Requires Verification)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setAuthMessage("Success! Check your email for the verification link.");
        setEmail("");
        setPassword("");
      }
    }
    setAuthLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  // ----------------------------------------------------
  // LEARNING LOGIC
  // ----------------------------------------------------
  async function handleLearn(event) {
    event.preventDefault();
    const trimmedTopic = topic.trim();

    if (!trimmedTopic) {
      setError("Tell me what you want to learn first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setLesson(null);

      // Backend ko verified user ka email bhej rahe hain
      const userEmail = session?.user?.email;
      const data = await learnTopic(trimmedTopic, mode, userEmail);

      setLesson({
        ...data,
        topic: data.topic || trimmedTopic,
        mode: data.mode || mode,
      });

      setTimeout(() => {
        document.querySelector(".learning-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

    } catch (err) {
      setError(err.message || "Something went wrong while creating your lesson.");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------------------
  // LOGIN/REGISTER SCREEN
  // ----------------------------------------------------
  if (!session) {
    return (
      <div className="login-screen">
        <div className="login-box">
          <div className="login-brand">
            <span className="brand-mark">LW</span>
            <span className="brand-name">LearnWise</span>
          </div>
          
          <h1>{isLoginView ? "Welcome back." : "Create your account."}</h1>
          <p className="login-subtitle">
            {isLoginView 
              ? "Sign in to access your personalized AI studio." 
              : "Sign up to start learning with AI. We will send a verification link to your email."}
          </p>
          
          <form onSubmit={handleAuth} className="login-form">
            <div className="input-group">
              <label>Email Address</label>
              <input
                className="login-input"
                type="email"
                placeholder="e.g. you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                className="login-input"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            {authError && <div className="error" style={{textAlign: "left"}}>{authError}</div>}
            {authMessage && <div style={{color: "var(--success-border)", background: "var(--success-bg)", padding: "10px", borderRadius: "6px", fontSize: "13px"}}>{authMessage}</div>}

            <button className="login-btn" type="submit" disabled={authLoading}>
              {authLoading ? "Please wait..." : (isLoginView ? "Sign In →" : "Sign Up →")}
            </button>
          </form>

          <p className="login-footer-text">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => { setIsLoginView(!isLoginView); setAuthError(""); setAuthMessage(""); }}
              style={{background: "none", border: "none", color: "var(--accent)", fontWeight: "bold", textDecoration: "underline"}}
            >
              {isLoginView ? "Sign up here" : "Sign in here"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN STUDIO
  // ----------------------------------------------------
  const userEmail = session.user.email;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/">
            <span className="brand-mark">LW</span>
            <span className="brand-name">LearnWise</span>
          </a>
          <div className="topbar-right">
            <span>{userEmail}</span>
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
            <button className="theme-toggle" onClick={handleSignOut} style={{borderColor: "var(--error-border)", color: "var(--error-border)"}}>
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">PERSONALIZED LEARNING STUDIO</div>
            <h1>Learn something <br /><em>worth knowing.</em></h1>
            <p className="hero-description">Choose a topic. Learn it clearly. Then prove you actually understood it.</p>
          </div>

          <div className="learning-box">
            <form className="learn-form" onSubmit={handleLearn}>
              <div className="input-row">
                <div className="input-wrapper">
                  <input
                    className="topic-input"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. How does machine learning work?"
                    disabled={loading}
                  />
                  {topic && (
                    <button type="button" className="clear-input" onClick={() => setTopic("")}>
                      ×
                    </button>
                  )}
                </div>
                <button className="learn-button" type="submit" disabled={loading}>
                  {loading ? "Building..." : "Start learning →"}
                </button>
              </div>

              <div className="learning-options">
                <div className="mode-area">
                  <div className="mode-selector">
                    {['simple', 'detailed', 'study', 'story', 'exam'].map((m) => (
                      <button
                        key={m} type="button"
                        className={mode === m ? "mode-button active" : "mode-button"}
                        onClick={() => setMode(m)} disabled={loading}
                      >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
            {error && <div className="error"><span>!</span> {error}</div>}
          </div>
        </section>

        {lesson && (
          <section className="learning-result">
            <div className="result-heading">
              <div>
                <span className="result-kicker">YOUR SESSION</span>
                <h2>Let's understand <em>{lesson.topic || topic}</em></h2>
              </div>
            </div>

            <Lesson explanation={lesson.explanation} topic={lesson.topic || topic} mode={lesson.mode || mode} />
            <KeyConcepts concepts={lesson.key_concepts} />
            <Quiz quiz={lesson.quiz} sessionId={lesson.session_id} userEmail={userEmail} />
          </section>
        )}

        <section className="dashboard-section">
          <div className="dashboard-grid">
            <History userEmail={userEmail} />
            <Progress userEmail={userEmail} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;