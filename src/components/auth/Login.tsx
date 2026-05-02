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
  handleLogin: (e?: React.FormEvent) => void;
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
  handleLogin,
}: LoginProps) {
  if (!authChecked) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard} style={{ textAlign: "center" }}>
          <div className={styles.loginBrand}>
            <span className={styles.loginBrandMark}>RC</span>
            <div><strong>RecyConnect</strong><span>Admin Panel</span></div>
          </div>
          <div className={styles.loadingBar} />
          <p style={{ color: "var(--text-muted)", marginTop: "16px", fontSize: "14px" }}>Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <span className={styles.loginBrandMark}>RC</span>
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
              placeholder="admin@recyconnect.com"
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
