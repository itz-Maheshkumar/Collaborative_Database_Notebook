"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerApi, loginApi } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register new user
      await registerApi(username.trim(), email.trim(), password);

      // 2. Auto login to obtain JWT
      const tokenData = await loginApi(email.trim(), password);

      // 3. Store auth & redirect to notebooks workspace
      setToken(tokenData.access_token);
      setUser(tokenData.user);

      router.push("/notebooks");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .signup-root {
          min-height: 100vh;
          background: #0a0d14;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 32px 16px;
        }

        .signup-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 80% 10%, rgba(16,185,129,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 20% 85%, rgba(99,102,241,0.15) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(139,92,246,0.10) 0%, transparent 50%);
          animation: meshShift 14s ease-in-out infinite alternate;
        }

        @keyframes meshShift {
          0%   { opacity: 1; transform: scale(1) translate(0, 0); }
          100% { opacity: 0.75; transform: scale(1.06) translate(2%, -1%); }
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: orbFloat 9s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .orb-1 {
          width: 380px; height: 380px;
          background: rgba(16,185,129,0.12);
          top: -100px; right: -80px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 300px; height: 300px;
          background: rgba(99,102,241,0.14);
          bottom: -80px; left: -60px;
          animation-delay: 2s;
        }
        @keyframes orbFloat {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-15px, 20px) scale(1.05); }
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 460px;
          background: rgba(15,18,30,0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 40px;
          box-shadow:
            0 0 0 1px rgba(16,185,129,0.08),
            0 32px 80px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.06);
          animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 24px; right: 24px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #10b981, #6366f1, transparent);
          border-radius: 0 0 4px 4px;
        }

        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }
        .logo-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #6366f1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(16,185,129,0.4);
        }
        .logo-icon svg { width: 18px; height: 18px; }
        .logo-text {
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          letter-spacing: -0.2px;
        }

        .heading {
          font-size: 24px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .subheading {
          font-size: 13.5px;
          color: rgba(148,163,184,0.9);
          margin-bottom: 28px;
          line-height: 1.5;
        }
        .subheading span {
          font-family: 'JetBrains Mono', monospace;
          color: #6366f1;
          font-size: 12px;
          background: rgba(99,102,241,0.1);
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid rgba(99,102,241,0.2);
        }

        .error-banner {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          padding: 11px 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fca5a5;
          font-size: 13px;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }

        .field {
          margin-bottom: 16px;
        }
        .field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: rgba(148,163,184,0.9);
          margin-bottom: 6px;
          letter-spacing: 0.2px;
          text-transform: uppercase;
        }
        .input-wrap {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(100,116,139,0.7);
          display: flex;
          align-items: center;
          pointer-events: none;
        }
        .field input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 11px;
          padding: 11px 14px 11px 40px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #f1f5f9;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .field input::placeholder { color: rgba(100,116,139,0.6); }
        .field input:focus {
          border-color: rgba(16,185,129,0.5);
          background: rgba(16,185,129,0.06);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
        }
        .field input:hover:not(:focus) {
          border-color: rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
        }
        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(100,116,139,0.7);
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .password-toggle:hover { color: rgba(148,163,184,0.9); }

        .btn-submit {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 14.5px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 4px 20px rgba(16,185,129,0.35);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          margin-top: 8px;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(16,185,129,0.45);
        }
        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .footer-text {
          text-align: center;
          margin-top: 22px;
          font-size: 13px;
          color: rgba(100,116,139,0.8);
        }
        .footer-text a {
          color: #10b981;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .footer-text a:hover { color: #34d399; }
      `}</style>

      <div className="signup-root">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="grid-overlay" />

        <div className="card">
          <div className="logo-wrap">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5v6c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
                <path d="M3 11v6c0 1.657 4.03 3 9 3s9-1.343 9-3v-6" />
              </svg>
            </div>
            <span className="logo-text">Collaborative DB Notebook</span>
          </div>

          <h1 className="heading">Create your account</h1>
          <p className="subheading">
            Start querying PostgreSQL, MySQL, MongoDB &amp;&nbsp;
            <span>SQLite</span>
          </p>

          {error && (
            <div className="error-banner">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="field">
              <label htmlFor="username">Username</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="field">
              <label htmlFor="email">Email address</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-submit" disabled={isLoading}>
              <div className="btn-inner">
                {isLoading ? (
                  <><div className="spinner" /> Creating account…</>
                ) : (
                  <>Create Account</>
                )}
              </div>
            </button>
          </form>

          {/* Footer */}
          <p className="footer-text">
            Already have an account?{" "}
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
