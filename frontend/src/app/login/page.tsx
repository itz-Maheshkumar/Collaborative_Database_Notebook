"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    // TODO: wire up to POST /api/v1/auth/login
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #0a0d14;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* animated mesh gradient */
        .login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,102,241,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 85%, rgba(16,185,129,0.12) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 60% 30%, rgba(139,92,246,0.10) 0%, transparent 50%);
          animation: meshShift 12s ease-in-out infinite alternate;
        }

        @keyframes meshShift {
          0%   { opacity: 1; transform: scale(1) translate(0, 0); }
          100% { opacity: 0.7; transform: scale(1.08) translate(-2%, 1%); }
        }

        /* floating orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: orbFloat 8s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .orb-1 {
          width: 380px; height: 380px;
          background: rgba(99,102,241,0.14);
          top: -120px; left: -100px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 280px; height: 280px;
          background: rgba(16,185,129,0.12);
          bottom: -80px; right: -60px;
          animation-delay: 3s;
        }
        .orb-3 {
          width: 200px; height: 200px;
          background: rgba(245,158,11,0.08);
          top: 40%; left: 70%;
          animation-delay: 1.5s;
        }
        @keyframes orbFloat {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(15px, -20px) scale(1.06); }
        }

        /* grid overlay */
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* card */
        .card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          margin: 24px;
          background: rgba(15,18,30,0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 44px 40px 40px;
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.08),
            0 32px 80px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.06);
          animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* top accent bar */
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 24px; right: 24px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #6366f1, #10b981, transparent);
          border-radius: 0 0 4px 4px;
        }

        /* logo area */
        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .logo-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #10b981);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(99,102,241,0.4);
        }
        .logo-icon svg { width: 18px; height: 18px; }
        .logo-text {
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          letter-spacing: -0.2px;
        }

        /* headings */
        .heading {
          font-size: 26px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .subheading {
          font-size: 13.5px;
          color: rgba(148,163,184,0.9);
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .subheading span {
          font-family: 'JetBrains Mono', monospace;
          color: #10b981;
          font-size: 12px;
          background: rgba(16,185,129,0.1);
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid rgba(16,185,129,0.2);
        }

        /* error banner */
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

        /* form groups */
        .field {
          margin-bottom: 18px;
        }
        .field label {
          display: block;
          font-size: 12.5px;
          font-weight: 500;
          color: rgba(148,163,184,0.9);
          margin-bottom: 7px;
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
          padding: 12px 14px 12px 40px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #f1f5f9;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .field input::placeholder { color: rgba(100,116,139,0.6); }
        .field input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.06);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
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

        /* forgot link */
        .forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -10px;
          margin-bottom: 26px;
        }
        .forgot-link {
          font-size: 12.5px;
          color: rgba(99,102,241,0.85);
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: #818cf8; }

        /* submit button */
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
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          box-shadow: 0 4px 20px rgba(99,102,241,0.35);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.1px;
        }
        .btn-submit::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          pointer-events: none;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(99,102,241,0.45);
        }
        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
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

        /* divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
          color: rgba(100,116,139,0.5);
          font-size: 12px;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }

        /* oauth stub */
        .btn-oauth {
          width: 100%;
          padding: 11px;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(203,213,225,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
        }
        .btn-oauth:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-1px);
        }

        /* footer */
        .footer-text {
          text-align: center;
          margin-top: 26px;
          font-size: 13px;
          color: rgba(100,116,139,0.8);
        }
        .footer-text a {
          color: #6366f1;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .footer-text a:hover { color: #818cf8; }

        /* bottom badge */
        .badge-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 20px;
          opacity: 0.5;
        }
        .badge-row span {
          font-size: 11px;
          color: rgba(100,116,139,0.8);
          font-family: 'JetBrains Mono', monospace;
        }
        .badge-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>

      <div className="login-root">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />

        <div className="card">

          {/* Logo */}
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

          <h1 className="heading">Welcome back</h1>
          <p className="subheading">
            Sign in to access your notebooks and&nbsp;
            <span>query cells</span>
          </p>

          {/* Error */}
          {error && (
            <div className="error-banner">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

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
                  autoComplete="current-password"
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

            {/* Forgot */}
            <div className="forgot-row">
              <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-submit" disabled={isLoading}>
              <div className="btn-inner">
                {isLoading ? (
                  <><div className="spinner" /> Signing in…</>
                ) : (
                  <>Sign in</>
                )}
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="divider">or continue with</div>

          {/* GitHub OAuth stub */}
          <button type="button" className="btn-oauth">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            Continue with GitHub
          </button>

          {/* Footer */}
          <p className="footer-text">
            Don't have an account?{" "}
            <Link href="/signup">Create one free</Link>
          </p>

          {/* Status badge */}
          <div className="badge-row">
            <div className="badge-dot" />
            <span>JWT · AES-256 · TLS 1.3</span>
          </div>

        </div>
      </div>
    </>
  );
}
