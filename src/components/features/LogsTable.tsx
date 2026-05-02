import React from "react";
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

export default function LogsTable({
  logs,
  loading,
  logActionFilter,
  setLogActionFilter,
  loadAdminData,
  token
}: LogsTableProps) {
  const filteredLogs = logs.filter((l) => {
    if (logActionFilter && !readString(l.action, "").toLowerCase().includes(logActionFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <section className={styles.tablePanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderInner}>
          <p className={styles.eyebrow}>Activity Logs</p>
          <h3>System Logs ({filteredLogs.length})</h3>
        </div>
        <div className={styles.panelActions}>
          <input 
            className={styles.searchInput} 
            placeholder="Filter by action..." 
            value={logActionFilter} 
            onChange={(e) => setLogActionFilter(e.target.value)} 
          />
          <button className={styles.btn} onClick={() => void loadAdminData()} disabled={!token || loading}>Refresh</button>
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
            <strong>No logs found</strong>
            <p>No logs match current filter.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const actor = log.actor as ApiRecord | undefined;
            return (
              <div className={`${styles.tableRow} ${styles.logGrid}`} key={readNumber(log.id)}>
                <span>#{readNumber(log.id)}</span>
                <div>
                  <strong>{readString(actor?.name, "System")}</strong>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{readString(actor?.role ?? log.actorRole, "—")}</div>
                </div>
                <span className={styles.badgePurple}>{readString(log.action)}</span>
                <div>
                  <span>{readString(log.resourceType, "—")}</span>
                  {Boolean(log.resourceId) && <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>ID: {readString(log.resourceId)}</div>}
                </div>
                <span>{formatDate(log.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
