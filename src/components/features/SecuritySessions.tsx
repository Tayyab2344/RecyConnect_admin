import React, { useState, useEffect } from "react";
import styles from "@/app/page.module.css";
import { fetchJson, postJson, putJson } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ApiRecord } from "@/types/admin";

export type SecuritySessionsProps = {
  token: string;
};

type SessionRecord = {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  createdAt: string;
  expiresAt: string;
  device: string;
  ip: string;
  userAgent: string;
};

export default function SecuritySessions({ token }: SecuritySessionsProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [users, setUsers] = useState<ApiRecord[]>([]);
  const [securityLogs, setSecurityLogs] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);
  
  // Reset password states
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  
  // Ban user states
  const [selectedUserForBan, setSelectedUserForBan] = useState<string>("");
  const [banReason, setBanReason] = useState("");
  
  // Status feedback
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setFeedback(null);
    try {
      const [sessionsRes, usersRes, logsRes] = await Promise.allSettled([
        fetchJson("/admin/sessions", token),
        fetchJson("/admin/users", token),
        fetchJson("/admin/logs?limit=100", token)
      ]);

      if (sessionsRes.status === "fulfilled") {
        setSessions(sessionsRes.value.data || []);
      }
      if (usersRes.status === "fulfilled") {
        setUsers(usersRes.value.data || []);
      }
      if (logsRes.status === "fulfilled") {
        const allLogs = logsRes.value.data || logsRes.value || [];
        // Filter logs relating to security, MFA, bans, password changes
        const filtered = allLogs.filter((log: any) => {
          const action = (log.action || "").toUpperCase();
          return (
            action.includes("LOGIN") ||
            action.includes("MFA") ||
            action.includes("PASSWORD") ||
            action.includes("BAN") ||
            action.includes("SUSPEND") ||
            action.includes("SECURITY")
          );
        });
        setSecurityLogs(filtered);
      }
    } catch (err: any) {
      console.error("Failed to load security and session telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  const handleRevokeSession = async (sessionId: number) => {
    setActionLoading(sessionId);
    setFeedback(null);
    try {
      await postJson(`/admin/sessions/${sessionId}/revoke`, token, {});
      setFeedback({ message: "Session terminated successfully.", type: "success" });
      void loadData();
    } catch (err: any) {
      setFeedback({ message: err.message || "Failed to terminate session.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword || !newPassword) return;
    setActionLoading("password");
    setFeedback(null);
    try {
      await postJson(`/admin/users/${selectedUserForPassword}/reset-password`, token, { newPassword });
      setFeedback({ message: "Password updated and user sessions revoked successfully.", type: "success" });
      setNewPassword("");
      void loadData();
    } catch (err: any) {
      setFeedback({ message: err.message || "Failed to reset password.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBan) return;
    setActionLoading("ban");
    setFeedback(null);
    try {
      await putJson(`/admin/users/${selectedUserForBan}/ban`, token, { reason: banReason });
      setFeedback({ message: "Account banned and all active sessions terminated.", type: "success" });
      setBanReason("");
      void loadData();
    } catch (err: any) {
      setFeedback({ message: err.message || "Failed to ban account.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "12px 0 32px 0" }}>
      {/* Hero Header */}
      <section className={styles.hero} style={{ marginBottom: 0 }}>
        <p className={styles.eyebrow}>Enterprise Governance Module</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Security & Session Governance</h2>
          <button className={styles.btn} onClick={() => void loadData()} disabled={loading}>
            {loading ? "Refreshing..." : "🔄 Refresh Telemetry"}
          </button>
        </div>
        <p>Monitor active administrator concurrent logins, review security threat logs, and override accounts.</p>
      </section>

      {feedback && (
        <div 
          style={{ 
            padding: "12px 16px", 
            borderRadius: "var(--radius)", 
            fontSize: "14px", 
            border: feedback.type === "success" ? "1px solid rgba(48, 217, 139, 0.3)" : "1px solid rgba(248, 81, 73, 0.3)",
            background: feedback.type === "success" ? "rgba(48, 217, 139, 0.1)" : "rgba(248, 81, 73, 0.1)",
            color: feedback.type === "success" ? "var(--accent)" : "var(--danger)",
            fontWeight: "500"
          }}
        >
          {feedback.type === "success" ? "✅ " : "❌ "}
          {feedback.message}
        </div>
      )}

      {/* Concurrent Sessions & Governance Grid */}
      <div className={styles.contentGrid}>
        {/* Active Session Management */}
        <article className={styles.panel} style={{ flex: 1.5 }}>
          <div className={styles.panelHeader} style={{ padding: 0, border: "none", marginBottom: "16px" }}>
            <div>
              <p className={styles.eyebrow}>Active logins</p>
              <h3>Concurrent Admin Sessions ({sessions.length})</h3>
            </div>
            <span className={styles.badge} style={{ background: "rgba(48, 217, 139, 0.2)", color: "#30d98b" }}>Max 3 Limits Active</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
            {sessions.length === 0 ? (
              <div className={styles.emptyState}>No active administrative sessions monitored.</div>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "16px",
                    background: "rgba(255,255,255,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ fontSize: "15px", color: "var(--text)" }}>{session.userName}</strong>
                      <span className={styles.badgePurple} style={{ marginLeft: "8px", fontSize: "10px" }}>{session.userRole.toUpperCase()}</span>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{session.userEmail}</div>
                    </div>
                    <button
                      className={styles.btn}
                      style={{ 
                        background: "rgba(248, 81, 73, 0.1)", 
                        color: "var(--danger)", 
                        border: "1px solid rgba(248, 81, 73, 0.2)",
                        fontSize: "11px",
                        padding: "4px 8px"
                      }}
                      disabled={actionLoading !== null}
                      onClick={() => void handleRevokeSession(session.id)}
                    >
                      {actionLoading === session.id ? "Terminating..." : "Revoke Session 🚪"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "4px", fontSize: "11px", color: "var(--text-dim)" }}>
                    <div>
                      <strong>💻 Device:</strong> {session.device}
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.userAgent.substring(0, 50)}...</div>
                    </div>
                    <div>
                      <div><strong>🌐 IP Address:</strong> {session.ip}</div>
                      <div><strong>🔑 Sign In:</strong> {formatDate(session.createdAt)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        {/* Administration Overrides & Credentials Control */}
        <article className={styles.panel} style={{ flex: 1 }}>
          <div className={styles.panelHeader} style={{ padding: 0, border: "none", marginBottom: "16px" }}>
            <div>
              <p className={styles.eyebrow}>Governance overrides</p>
              <h3>Account Overrides</h3>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Force Reset Credentials */}
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h4 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Reset User Credentials</h4>
              <select
                className={styles.searchInput}
                style={{ width: "100%", padding: "10px", background: "var(--bg-input)" }}
                value={selectedUserForPassword}
                onChange={(e) => setSelectedUserForPassword(e.target.value)}
                required
              >
                <option value="">-- Select Platform Account --</option>
                {users.map((u) => (
                  <option key={u.id as number} value={u.id as number}>
                    {(u.name as string) || (u.businessName as string) || (u.companyName as string)} ({(u.email as string) || (u.role as string)})
                  </option>
                ))}
              </select>

              <input
                className={styles.searchInput}
                style={{ width: "100%", padding: "10px", background: "var(--bg-input)" }}
                type="password"
                placeholder="Enter new secure password..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <button
                type="submit"
                className={styles.btn}
                style={{ background: "var(--primary)", color: "white", padding: "10px" }}
                disabled={actionLoading !== null || !selectedUserForPassword || !newPassword}
              >
                {actionLoading === "password" ? "Updating..." : "Force Reset Credentials 🔑"}
              </button>
            </form>

            <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

            {/* Instant Fraud Ban */}
            <form onSubmit={handleBanUser} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h4 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Fraud / Risk Isolation</h4>
              <select
                className={styles.searchInput}
                style={{ width: "100%", padding: "10px", background: "var(--bg-input)" }}
                value={selectedUserForBan}
                onChange={(e) => setSelectedUserForBan(e.target.value)}
                required
              >
                <option value="">-- Select Banned Target --</option>
                {users.filter(u => u.verificationStatus !== "BLOCKED" && u.role !== "admin").map((u) => (
                  <option key={u.id as number} value={u.id as number}>
                    {(u.name as string) || (u.businessName as string) || (u.companyName as string)} ({(u.email as string) || (u.role as string)})
                  </option>
                ))}
              </select>

              <input
                className={styles.searchInput}
                style={{ width: "100%", padding: "10px", background: "var(--bg-input)" }}
                type="text"
                placeholder="Reason for immediate ban..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />

              <button
                type="submit"
                className={styles.btn}
                style={{ background: "var(--danger)", color: "white", padding: "10px" }}
                disabled={actionLoading !== null || !selectedUserForBan}
              >
                {actionLoading === "ban" ? "Processing Ban..." : "Restrict & Ban User 🚫"}
              </button>
            </form>
          </div>
        </article>
      </div>

      {/* Security Threat log and Telemetry feed */}
      <section className={styles.tablePanel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Anomaly audit logs</p>
            <h3>Security Governance Audit Log</h3>
          </div>
          <span className={styles.badgeDanger}>{securityLogs.length} Security Events Logs</span>
        </div>

        <div className={styles.tableWrap} style={{ maxHeight: "300px", overflowY: "auto" }}>
          <div className={styles.tableHead} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", gap: "10px", padding: "12px 16px" }}>
            <span>Timestamp</span>
            <span>Actor / Source</span>
            <span>Security Action / Details</span>
            <span>IP / Context</span>
          </div>

          {securityLogs.length === 0 ? (
            <div className={styles.emptyState}>No administrative threat alerts or security logs recorded.</div>
          ) : (
            securityLogs.map((log: any) => (
              <div 
                key={log.id} 
                className={styles.tableRow}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr", gap: "10px", padding: "12px 16px", fontSize: "12px", alignItems: "center" }}
              >
                <span>{formatDate(log.createdAt)}</span>
                <div>
                  <strong>{log.actor?.name || "System"}</strong>
                  <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>{log.actorRole || "system"}</div>
                </div>
                <div>
                  <span className={log.action.includes("BAN") || log.action.includes("FAILED") ? styles.badgeDanger : styles.badgePurple} style={{ display: "inline-block", marginBottom: "4px" }}>
                    {log.action}
                  </span>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                    {log.meta?.reason || log.meta?.device || log.resourceType ? `Target: ${log.resourceType || ""} #${log.resourceId || ""}` : ""}
                  </div>
                </div>
                <div>
                  <strong>{log.ip || "127.0.0.1"}</strong>
                  <div style={{ fontSize: "10px", color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {log.userAgent || "—"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
