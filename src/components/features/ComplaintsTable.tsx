import React, { useState } from "react";
import styles from "@/app/page.module.css";
import { ApiRecord } from "@/types/admin";
import { putJson } from "@/lib/api";
import { Icons } from "../common/Icons";

type ComplaintsTableProps = {
  complaints: ApiRecord[];
  loading: boolean;
  complaintStatusFilter: string;
  setComplaintStatusFilter: (v: string) => void;
  loadAdminData: (token: string) => Promise<void>;
  token: string;
};

export default function ComplaintsTable({
  complaints,
  loading,
  complaintStatusFilter,
  setComplaintStatusFilter,
  loadAdminData,
  token,
}: ComplaintsTableProps) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});

  const filteredComplaints = complaints.filter(
    (c) =>
      !complaintStatusFilter ||
      (c.status as string).toLowerCase() === complaintStatusFilter.toLowerCase()
  );

  const handleUpdateStatus = async (id: number, status: string) => {
    if (!confirm(`Are you sure you want to mark this complaint as ${status}?`)) return;
    setUpdatingId(id);
    try {
      await putJson(`/admin/complaints/${id}`, token, { status, adminNotes: adminNotes[id] || "" });
      alert(`Complaint marked as ${status}`);
      await loadAdminData(token);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className={styles.tablePanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderInner}>
          <p className={styles.eyebrow}>System Health</p>
          <h3>System Complaints ({filteredComplaints.length})</h3>
        </div>
        <div className={styles.panelActions}>
          <div className={styles.searchBar}>
            <select
              className={styles.filterSelect}
              value={complaintStatusFilter}
              onChange={(e) => setComplaintStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <button className={styles.btn} onClick={() => void loadAdminData(token)} disabled={!token || loading}>Refresh</button>
        </div>
      </div>
      
      {loading && <div className={styles.loadingBar} />}

      <div className={styles.tableWrap}>
        <div className={`${styles.tableHead} ${styles.complaintGrid}`}>
          <span>ID</span><span>User</span><span>Category</span><span>Description</span><span>Status</span><span>Date</span><span>Actions</span>
        </div>
        {filteredComplaints.length === 0 ? (
          <div className={styles.emptyState}>
            <Icons.Complaints size={36} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
            <strong>No complaints found</strong>
            <p>No complaints match current filters.</p>
          </div>
        ) : (
          filteredComplaints.map((comp) => {
            const user = comp.user as ApiRecord;
            const status = (comp.status as string) || "PENDING";
            
            let statusClass = styles.badgeWarning;
            if (status === "RESOLVED") statusClass = styles.badge;
            if (status === "IN_REVIEW") statusClass = styles.badgeInfo;
            if (status === "DISMISSED") statusClass = styles.badgeDanger;

            return (
              <div className={`${styles.tableRow} ${styles.complaintGrid}`} key={comp.id as number}>
                <span>#{comp.id as number}</span>
                <div>
                  <strong>{user?.name as string || "Unknown"}</strong>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>
                    {user?.email as string || ""}
                    {user?.role ? ` (${user.role})` : ""}
                  </div>
                </div>
                <span>
                  <span className={styles.badgePurple} style={{ background: "var(--bg-elevated)", color: "var(--text)" }}>
                    {String(comp.category)}
                  </span>
                </span>
                <div style={{ maxWidth: "300px" }}>
                  <div style={{ fontSize: "0.85rem", whiteSpace: "normal" }}>
                    {String(comp.description)}
                  </div>
                  {Boolean(comp.adminNotes) && (
                    <div style={{ fontSize: "0.8rem", color: "var(--primary)", marginTop: "4px", borderTop: "1px solid var(--border)", paddingTop: "4px" }}>
                      <strong>Admin: </strong> {String(comp.adminNotes)}
                    </div>
                  )}
                </div>
                <span>
                  <span className={statusClass}>
                    {status}
                  </span>
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {new Date(comp.createdAt as string).toLocaleString()}
                </span>
                <div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {status === "PENDING" && (
                      <button
                        className={`${styles.btn} ${styles.btnSmall}`}
                        onClick={() => handleUpdateStatus(comp.id as number, "IN_REVIEW")}
                        disabled={updatingId === comp.id}
                      >
                        Review
                      </button>
                    )}
                    {(status === "PENDING" || status === "IN_REVIEW") && (
                      <>
                        <input
                          type="text"
                          placeholder="Admin notes..."
                          className={styles.searchInput}
                          style={{ minHeight: "32px", padding: "0 8px", fontSize: "0.8rem", minWidth: "0" }}
                          value={adminNotes[comp.id as number] || ""}
                          onChange={(e) => setAdminNotes({ ...adminNotes, [comp.id as number]: e.target.value })}
                        />
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
                            style={{ flex: 1, padding: "0 4px" }}
                            onClick={() => handleUpdateStatus(comp.id as number, "RESOLVED")}
                            disabled={updatingId === comp.id}
                          >
                            Resolve
                          </button>
                          <button
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                            style={{ flex: 1, padding: "0 4px" }}
                            onClick={() => handleUpdateStatus(comp.id as number, "DISMISSED")}
                            disabled={updatingId === comp.id}
                          >
                            Dismiss
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
