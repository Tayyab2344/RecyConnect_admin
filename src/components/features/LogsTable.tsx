import React, { useState } from "react";
import styles from "@/app/page.module.css";
import { ApiRecord } from "@/types/admin";
import { readString, readNumber, formatDate } from "@/lib/utils";

export type LogsTableProps = {
  logs: ApiRecord[];
  loading: boolean;
  logActionFilter: string;
  setLogActionFilter: (val: string) => void;
  loadAdminData: () => Promise<void>;
  token: string;
};

type TimeframePreset = "all" | "today" | "yesterday" | "week" | "month";

export default function LogsTable({
  logs,
  loading,
  logActionFilter,
  setLogActionFilter,
  loadAdminData,
  token
}: LogsTableProps) {
  // ERP Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timePreset, setTimePreset] = useState<TimeframePreset>("all");
  
  // Interactive UI State
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Apply Time Preset helper
  const handlePresetChange = (preset: TimeframePreset) => {
    setTimePreset(preset);
    const now = new Date();
    
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
    } else if (preset === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === "month") {
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);
      setStartDate(monthAgo.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Filter Logic
  const filteredLogs = logs.filter((log) => {
    // 1. Universal Search (checks Actor name, Actor email, Action, and Resource ID)
    const actor = log.actor as ApiRecord | undefined;
    const actorName = readString(actor?.name || log.actorName || "System", "").toLowerCase();
    const actorEmail = readString(actor?.email, "").toLowerCase();
    const action = readString(log.action, "").toLowerCase();
    const resourceId = readString(log.resourceId, "").toLowerCase();
    const query = searchQuery.toLowerCase();

    if (query) {
      const match = actorName.includes(query) || 
                    actorEmail.includes(query) || 
                    action.includes(query) || 
                    resourceId.includes(query);
      if (!match) return false;
    }

    // 2. Role Filter
    const actorRole = readString(actor?.role || log.actorRole || "system").toLowerCase();
    if (roleFilter && actorRole !== roleFilter.toLowerCase()) return false;

    // 3. Resource Type Filter
    const resType = readString(log.resourceType, "").toLowerCase();
    if (resourceFilter && resType !== resourceFilter.toLowerCase()) return false;

    // 4. Date Filter
    const logDate = new Date(readString(log.createdAt));
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (logDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (logDate > end) return false;
    }

    return true;
  });

  // Action badge color helper
  const getActionBadgeClass = (actionName: string) => {
    const act = actionName.toUpperCase();
    if (act.includes("FAIL") || act.includes("ERROR") || act.includes("BAN") || act.includes("DENY") || act.includes("REJECT") || act.includes("SUSPEND")) {
      return styles.badgeDanger;
    }
    if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("CANCEL") || act.includes("CLEAR")) {
      return styles.badgeWarning;
    }
    if (act.includes("CREATE") || act.includes("ADD") || act.includes("PUBLISH") || act.includes("SUBMIT") || act.includes("CONFIRM")) {
      return styles.badge; // green
    }
    if (act.includes("LOGIN") || act.includes("AUTH") || act.includes("VERIFY")) {
      return styles.badgeInfo; // blue
    }
    return styles.badgePurple;
  };

  // Export Filtered Audit logs Ledger to CSV
  const handleExportCSV = () => {
    const headers = ["Log ID", "Actor Name", "Actor Role", "Actor Email", "Action", "Resource Type", "Resource ID", "IP Address", "User Agent", "Timestamp"];
    const rows = filteredLogs.map((log) => {
      const actor = log.actor as ApiRecord | undefined;
      return [
        log.id,
        actor?.name || log.actorName || "System",
        actor?.role || log.actorRole || "system",
        actor?.email || "N/A",
        log.action,
        log.resourceType || "N/A",
        log.resourceId || "N/A",
        log.ip || "N/A",
        `"${readString(log.userAgent, "N/A").replace(/"/g, '""')}"`,
        new Date(log.createdAt as string).toISOString()
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RecyConnect_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className={styles.tablePanel}>
      <div className={styles.panelHeader} style={{ flexDirection: "column", alignItems: "stretch", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div className={styles.panelHeaderInner}>
            <p className={styles.eyebrow}>Security & Audit Logs</p>
            <h3 style={{ fontSize: "18px", fontWeight: 800 }}>RecyConnect ERP Audit Ledger</h3>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleExportCSV} className={`${styles.btn} ${styles.btnSmall}`} style={{ borderColor: "var(--accent)", color: "var(--accent)" }} disabled={filteredLogs.length === 0}>
              📥 Export CSV Ledger
            </button>
            <button className={`${styles.btn} ${styles.btnSmall}`} onClick={() => void loadAdminData()} disabled={!token || loading}>
              {loading ? "Refreshing..." : "↻ Refresh Logs"}
            </button>
          </div>
        </div>

        {/* ERP Advanced Filter Row */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
          gap: "12px", 
          paddingTop: "14px", 
          borderTop: "1px solid var(--border)" 
        }}>
          {/* Universal query */}
          <div style={{ display: "grid", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>Search Actor/Action/ID</label>
            <input 
              className={styles.searchInput} 
              placeholder="Search Actor, Action, Resource ID..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ width: "100%", minHeight: "38px" }}
            />
          </div>

          {/* Actor Role Filter */}
          <div style={{ display: "grid", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>Actor Role</label>
            <select 
              className={styles.filterSelect}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ width: "100%", minHeight: "38px" }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="individual">Individual</option>
              <option value="warehouse">Warehouse</option>
              <option value="company">Company</option>
              <option value="collector">Collector</option>
              <option value="system">System / Anonymous</option>
            </select>
          </div>

          {/* Resource Type Filter */}
          <div style={{ display: "grid", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>Resource Type</label>
            <select 
              className={styles.filterSelect}
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              style={{ width: "100%", minHeight: "38px" }}
            >
              <option value="">All Resource Types</option>
              <option value="user">User Registry</option>
              <option value="listing">Marketplace Listing</option>
              <option value="order">Order Transaction</option>
              <option value="payment">Payment Record</option>
              <option value="rate">Rate Card</option>
              <option value="complaint">Complaint Ticket</option>
              <option value="kyc">KYC verification</option>
              <option value="security">Security Session</option>
            </select>
          </div>

          {/* Date Presets Dropdown */}
          <div style={{ display: "grid", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>Time Presets</label>
            <select 
              className={styles.filterSelect}
              value={timePreset}
              onChange={(e) => handlePresetChange(e.target.value as TimeframePreset)}
              style={{ width: "100%", minHeight: "38px" }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          <div style={{ display: "grid", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>Start Date</label>
            <input 
              type="date"
              className={styles.searchInput}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setTimePreset("all"); }}
              style={{ width: "100%", minHeight: "38px" }}
            />
          </div>

          <div style={{ display: "grid", gap: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>End Date</label>
            <input 
              type="date"
              className={styles.searchInput}
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setTimePreset("all"); }}
              style={{ width: "100%", minHeight: "38px" }}
            />
          </div>
        </div>
      </div>
      
      {loading && <div className={styles.loadingBar} />}

      <div className={styles.tableWrap}>
        <div className={`${styles.tableHead} ${styles.logGrid}`}>
          <span>ID</span><span>Actor</span><span>Action</span><span>Resource</span><span>Time</span>
        </div>
        {filteredLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <span>📋</span>
            <strong>No audit records match filters</strong>
            <p>Try clearing your queries or adjusting the date range filters.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const actor = log.actor as ApiRecord | undefined;
            const logId = readNumber(log.id);
            const isExpanded = expandedLogId === logId;
            const action = readString(log.action);
            
            return (
              <React.Fragment key={logId}>
                <div 
                  className={`${styles.tableRow} ${styles.logGrid}`} 
                  onClick={() => setExpandedLogId(isExpanded ? null : logId)}
                  style={{ 
                    cursor: "pointer", 
                    background: isExpanded ? "var(--bg-card-hover)" : "transparent",
                    transition: "background var(--transition)"
                  }}
                >
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>#{logId}</span>
                  <div>
                    <strong>{readString(actor?.name || log.actorName, "System")}</strong>
                    <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>
                      {readString(actor?.role ?? log.actorRole, "system").toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <span className={getActionBadgeClass(action)} style={{ fontSize: "10px", padding: "2px 8px" }}>
                      {action}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>{readString(log.resourceType, "—")}</span>
                    {Boolean(log.resourceId) && (
                      <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>
                        ID: {readString(log.resourceId)}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "13px" }}>{formatDate(log.createdAt)}</span>
                </div>

                {isExpanded && (
                  <div style={{
                    gridColumn: "1 / -1",
                    background: "rgba(16, 185, 129, 0.02)",
                    borderBottom: "1px solid var(--border)",
                    padding: "20px 24px",
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr",
                    gap: "32px",
                    fontSize: "13px",
                    animation: "fadeIn 200ms ease"
                  }}>
                    {/* Left Panel: Tech/Client details */}
                    <div style={{ display: "grid", alignContent: "start", gap: "14px" }}>
                      <div>
                        <strong style={{ display: "block", color: "var(--text-dim)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.5px", marginBottom: "4px" }}>
                          Actor Email
                        </strong>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>
                          {readString(actor?.email, "system@recyconnect.com")}
                        </span>
                      </div>
                      <div>
                        <strong style={{ display: "block", color: "var(--text-dim)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.5px", marginBottom: "4px" }}>
                          IP Address
                        </strong>
                        <span style={{ 
                          fontFamily: "monospace", 
                          background: "var(--border-light)", 
                          color: "var(--text)",
                          padding: "3px 8px", 
                          borderRadius: "4px", 
                          border: "1px solid var(--border)",
                          fontSize: "12px"
                        }}>
                          {readString(log.ip, "127.0.0.1")}
                        </span>
                      </div>
                      <div>
                        <strong style={{ display: "block", color: "var(--text-dim)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.5px", marginBottom: "4px" }}>
                          User Agent
                        </strong>
                        <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                          {readString(log.userAgent, "Unknown Client Browser")}
                        </span>
                      </div>
                    </div>

                    {/* Right Panel: JSON Metadata Payload */}
                    <div style={{ display: "grid", gap: "6px" }}>
                      <strong style={{ display: "block", color: "var(--text-dim)", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.5px" }}>
                        Payload Metadata Context
                      </strong>
                      <pre style={{
                        background: "var(--border-light)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "14px",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        color: "var(--text-muted)",
                        overflowX: "auto",
                        maxHeight: "180px",
                        lineHeight: "1.4"
                      }}>
                        {JSON.stringify(log.meta || log.metadata || { message: "No metadata payload for this action." }, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </section>
  );
}
