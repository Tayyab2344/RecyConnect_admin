import React from "react";
import styles from "@/app/page.module.css";

export type LoginProps = {
  authChecked: boolean;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  loginError: string;
  loginLoading: boolean;
  requiresMfa: boolean;
  setRequiresMfa: (val: boolean) => void;
  mfaEmail: string;
  mfaOtp: string;
  setMfaOtp: (val: string) => void;
  handleLogin: (e?: React.FormEvent) => void;
  handleVerifyMfa: (e?: React.FormEvent) => void;
};

export default function Login({
  authChecked,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showPassword,
  setShowPassword,
  loginError,
  loginLoading,
  requiresMfa,
  setRequiresMfa,
  mfaEmail,
  mfaOtp,
  setMfaOtp,
  handleLogin,
  handleVerifyMfa,
}: LoginProps) {
  if (!authChecked) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard} style={{ textAlign: "center" }}>
          <div className={styles.loginBrand}>
            <img 
              src="/app_ico.png" 
              alt="RecyConnect Logo" 
              style={{ 
                width: "44px", 
                height: "44px", 
                borderRadius: "10px", 
                objectFit: "contain",
                boxShadow: "0 4px 12px -2px rgba(48, 217, 139, 0.3)" 
              }} 
            />
            <div><strong>RecyConnect</strong><span>Admin Panel</span></div>
          </div>
          <div className={styles.loadingBar} />
          <p style={{ color: "var(--text-muted)", marginTop: "16px", fontSize: "14px" }}>Checking session...</p>
        </div>
      </div>
    );
  }

  if (requiresMfa) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard} style={{ backdropFilter: "blur(20px)", background: "rgba(26, 31, 46, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div className={styles.loginBrand}>
            <img 
              src="/app_ico.png" 
              alt="RecyConnect Logo" 
              style={{ 
                width: "44px", 
                height: "44px", 
                borderRadius: "10px", 
                objectFit: "contain",
                boxShadow: "0 4px 12px -2px rgba(48, 217, 139, 0.3)" 
              }} 
            />
            <div><strong>RecyConnect</strong><span>Security Shield</span></div>
          </div>

          <h1 className={styles.loginTitle} style={{ color: "var(--purple)", marginTop: "12px" }}>Enter Verification Code</h1>
          <p className={styles.loginSubtitle}>
            A secure 6-digit OTP code has been sent to <strong style={{ color: "var(--text)" }}>{mfaEmail}</strong>. Please enter it below to authorize this session.
          </p>

          <form className={styles.loginForm} onSubmit={handleVerifyMfa}>
            <div className={styles.loginField}>
              <label htmlFor="mfa-otp" style={{ color: "var(--purple)", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Secure OTP Code</label>
              <input
                id="mfa-otp"
                className={styles.loginInput}
                style={{ 
                  textAlign: "center", 
                  fontSize: "24px", 
                  letterSpacing: "8px", 
                  fontFamily: "monospace", 
                  fontWeight: "bold",
                  borderColor: "rgba(167, 139, 250, 0.3)",
                  background: "rgba(0,0,0,0.2)"
                }}
                type="text"
                maxLength={6}
                placeholder="000000"
                value={mfaOtp}
                onChange={(e) => setMfaOtp(e.target.value.replace(/\D/g, ""))}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            {loginError && <div className={styles.loginError} style={{ borderLeft: "3px solid var(--danger)", background: "var(--danger-bg)", padding: "10px 12px", fontSize: "13px" }}>{loginError}</div>}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button 
                type="button"
                className={styles.btn}
                style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                onClick={() => setRequiresMfa(false)}
              >
                Back
              </button>
              <button 
                type="submit" 
                className={styles.loginButton} 
                style={{ flex: 2, margin: 0, background: "linear-gradient(135deg, var(--purple), var(--accent))", color: "var(--bg)", fontWeight: "bold" }}
                disabled={loginLoading || mfaOtp.length !== 6}
              >
                {loginLoading ? "Authorizing..." : "Confirm & Sign In 🛡️"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <img 
            src="/app_ico.png" 
            alt="RecyConnect Logo" 
            style={{ 
              width: "44px", 
              height: "44px", 
              borderRadius: "10px", 
              objectFit: "contain",
              boxShadow: "0 4px 12px -2px rgba(48, 217, 139, 0.3)" 
            }} 
          />
          <div><strong>RecyConnect</strong><span>Admin Panel</span></div>
        </div>

        <h1 className={styles.loginTitle}>Welcome back</h1>
        <p className={styles.loginSubtitle}>Sign in with your admin credentials to access the command center.</p>

        <form className={styles.loginForm} onSubmit={handleLogin}>
          <div className={styles.loginField}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className={styles.loginInput}
              type="email"
              placeholder="umer@recyconnect.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className={styles.loginField}>
            <label htmlFor="login-password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="login-password"
                className={styles.loginInput}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className={styles.showPasswordBtn} 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {loginError && <div className={styles.loginError}>{loginError}</div>}

          <button 
            type="submit" 
            className={styles.loginButton} 
            disabled={loginLoading || !loginEmail || !loginPassword}
          >
            {loginLoading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
