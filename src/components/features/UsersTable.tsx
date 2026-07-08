import React, { useState } from "react";
import styles from "@/app/page.module.css";
import { ApiRecord } from "@/types/admin";
import { readString, readNumber, formatDate } from "@/lib/utils";
import { Icons } from "../common/Icons";
import { postJson, putJson } from "@/lib/api";

export type UsersTableProps = {
  users: ApiRecord[];
  loading: boolean;
  userSearch: string;
  setUserSearch: (val: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (val: string) => void;
  loadAdminData: () => Promise<void>;
  token: string;
};

export default function UsersTable({
  users,
  loading,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  loadAdminData,
  token
}: UsersTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [showBanPrompt, setShowBanPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredUsers = users.filter((u) => {
    if (userRoleFilter && readString(u.role) !== userRoleFilter) return false;
    if (userSearch) {
      const name = readString(u.name || u.businessName || u.companyName, "").toLowerCase();
      const email = readString(u.email, "").toLowerCase();
      if (!name.includes(userSearch.toLowerCase()) && !email.includes(userSearch.toLowerCase())) return false;
    }
    return true;
  });

  // Find currently selected user from the live users array to receive real-time updates
  const activeUser = selectedUserId 
    ? users.find((u) => readNumber(u.id) === selectedUserId) 
    : null;

  const handleApproveKYC = async (userId: number) => {
    if (!confirm("Are you sure you want to approve this user's KYC verification request?")) return;
    setActionLoading(true);
    setErrorMessage("");
    try {
      await postJson("/admin/kyc/approve", token, { userId });
      alert("User KYC approved successfully!");
      await loadAdminData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to approve KYC");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectKYC = async (userId: number) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setActionLoading(true);
    setErrorMessage("");
    try {
      await postJson("/admin/kyc/reject", token, { userId, reason: rejectionReason });
      alert("User KYC rejected successfully.");
      await loadAdminData();
      setShowRejectPrompt(false);
      setRejectionReason("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reject KYC");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendUser = async (userId: number, currentStatus: string) => {
    const isSuspended = currentStatus === "SUSPENDED";
    const actionText = isSuspended ? "activate" : "suspend";
    if (!confirm(`Are you sure you want to ${actionText} this user's account?`)) return;
    
    setActionLoading(true);
    setErrorMessage("");
    try {
      await putJson(`/admin/users/${userId}/suspend`, token, { suspended: !isSuspended });
      alert(`User account ${isSuspended ? "activated" : "suspended"} successfully!`);
      await loadAdminData();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to ${actionText} user`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async (userId: number) => {
    if (!banReason.trim()) {
      alert("Please provide a reason for the ban.");
      return;
    }
    setActionLoading(true);
    setErrorMessage("");
    try {
      await putJson(`/admin/users/${userId}/ban`, token, { reason: banReason });
      alert("User account has been banned/blocked.");
      await loadAdminData();
      setShowBanPrompt(false);
      setBanReason("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to ban user");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className={styles.tablePanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderInner}>
          <p className={styles.eyebrow}>User Management</p>
          <h3>All Users ({filteredUsers.length})</h3>
        </div>
        <div className={styles.panelActions}>
          <div className={styles.searchBar}>
            <input 
              className={styles.searchInput} 
              placeholder="Search by name or email..." 
              value={userSearch} 
              onChange={(e) => setUserSearch(e.target.value)} 
            />
            <select 
              className={styles.filterSelect} 
              value={userRoleFilter} 
              onChange={(e) => setUserRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="individual">Individual</option>
              <option value="warehouse">Warehouse</option>
              <option value="company">Company</option>
              <option value="collector">Collector</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className={styles.btn} onClick={() => void loadAdminData()} disabled={!token || loading}>Refresh</button>
        </div>
      </div>
      {loading && <div className={styles.loadingBar} />}
      <div className={styles.tableWrap}>
        <div className={`${styles.tableHead} ${styles.userGrid}`}>
          <span>User</span><span>Role</span><span>Status</span><span>Created</span><span>ID</span>
        </div>
        {filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <Icons.Users size={36} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
            <strong>No users found</strong>
            <p>No users match current filters.</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const status = readString(user.verificationStatus, "PENDING");
            const statusClass = status === "VERIFIED" ? styles.badge : status === "SUSPENDED" ? styles.badgeDanger : styles.badgeWarning;
            const uId = readNumber(user.id);
            return (
              <div 
                className={`${styles.tableRow} ${styles.userGrid}`} 
                key={uId} 
                onClick={() => setSelectedUserId(uId)} 
                style={{ cursor: "pointer" }}
              >
                <div>
                  <strong>{readString(user.name || user.businessName || user.companyName, "—")}</strong>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{readString(user.email, "—")}</div>
                </div>
                <span className={styles.badgeInfo}>{readString(user.role)}</span>
                <span className={statusClass}>{status}</span>
                <span>{formatDate(user.createdAt)}</span>
                <span>#{uId}</span>
              </div>
            );
          })
        )}
      </div>

      {/* User Details & KYC Modal Overlay */}
      {activeUser && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(5px)"
          }}
          onClick={() => {
            if (!actionLoading) {
              setSelectedUserId(null);
              setShowRejectPrompt(false);
              setShowBanPrompt(false);
              setErrorMessage("");
            }
          }}
        >
          <div 
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              width: "90%",
              maxWidth: "700px",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "28px",
              color: "var(--text)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px" }}>User Detail Inspector</h3>
                <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>ID: #{readNumber(activeUser.id)} | Role: {readString(activeUser.role).toUpperCase()}</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedUserId(null);
                  setShowRejectPrompt(false);
                  setShowBanPrompt(false);
                  setErrorMessage("");
                }} 
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "22px", cursor: "pointer" }}
                disabled={actionLoading}
              >
                &times;
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={{ padding: "12px", borderRadius: "var(--radius-sm)", backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid var(--danger)", color: "var(--danger)", fontSize: "14px" }}>
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Profile Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
              <div>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "12px" }}>Account Name</span>
                <strong>{readString(activeUser.name || activeUser.businessName || activeUser.companyName, "—")}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "12px" }}>Email Address</span>
                <strong>{readString(activeUser.email, "—")}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "12px" }}>Contact Number</span>
                <strong>{readString(activeUser.contactNo, "—")}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "12px" }}>Location (City / Area)</span>
                <strong>{readString(activeUser.city, "")} / {readString(activeUser.area, "")}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "12px" }}>Verification Status</span>
                <span className={readString(activeUser.verificationStatus) === "VERIFIED" ? styles.badge : readString(activeUser.verificationStatus) === "SUSPENDED" ? styles.badgeDanger : styles.badgeWarning}>
                  {readString(activeUser.verificationStatus, "PENDING")}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)", display: "block", fontSize: "12px" }}>Registered Date</span>
                <strong>{formatDate(activeUser.createdAt)}</strong>
              </div>
            </div>

            {/* Registration KYC Details */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "var(--accent)" }}>KYC & Verification Info</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
                <div>
                  <span style={{ color: "var(--text-dim)", display: "block", fontSize: "12px" }}>CNIC Number</span>
                  <strong>{readString(activeUser.cnic, "—")}</strong>
                </div>
                {readString(activeUser.businessLicense) && (
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block", fontSize: "12px" }}>Business License</span>
                    <strong>{readString(activeUser.businessLicense, "—")}</strong>
                  </div>
                )}
                {readString(activeUser.taxNumber) && (
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block", fontSize: "12px" }}>Tax/NTN Number</span>
                    <strong>{readString(activeUser.taxNumber, "—")}</strong>
                  </div>
                )}
                {readNumber(activeUser.warehouseCapacity) > 0 && (
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block", fontSize: "12px" }}>Warehouse Capacity</span>
                    <strong>{readNumber(activeUser.warehouseCapacity)} kg</strong>
                  </div>
                )}
                {readString(activeUser.requestedRole) && (
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block", fontSize: "12px" }}>Requested Role Upgrade</span>
                    <strong style={{ color: "var(--warning)" }}>{readString(activeUser.requestedRole)}</strong>
                  </div>
                )}
                {readString(activeUser.rejectionReason) && (
                  <div style={{ gridColumn: "span 2", backgroundColor: "rgba(239, 68, 68, 0.05)", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border)" }}>
                    <span style={{ color: "var(--danger)", display: "block", fontSize: "12px", fontWeight: "bold" }}>Reason for Rejection / Ban</span>
                    <p style={{ margin: "4px 0 0 0", color: "var(--text)", fontSize: "13px" }}>{readString(activeUser.rejectionReason)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Documents */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "var(--accent)" }}>Attached Documents / Files</h4>
              {(!activeUser.documents || (activeUser.documents as any[]).length === 0) ? (
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>No documents uploaded by this user.</p>
              ) : (
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px" }}>
                  {(activeUser.documents as any[]).map((doc: any, i: number) => {
                    const fileUrl = readString(doc.fileUrl, "");
                    const docType = readString(doc.docType, "Document").toUpperCase();
                    const isImage = /\.(jpg|jpeg|png|webp|gif)/i.test(fileUrl);
                    return (
                      <div 
                        key={doc.id || i} 
                        style={{ 
                          border: "1px solid var(--border)", 
                          borderRadius: "var(--radius-sm)", 
                          padding: "12px", 
                          background: "rgba(255,255,255,0.02)", 
                          width: "calc(50% - 8px)", 
                          minWidth: "260px",
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "8px" 
                        }}
                      >
                        <strong style={{ fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
                          <span>{docType}</span>
                          {doc.encrypted && <span style={{ color: "var(--accent)", fontSize: "11px" }}>🔒 Encrypted</span>}
                        </strong>
                        {isImage ? (
                          <img 
                            src={fileUrl} 
                            alt={docType} 
                            style={{ 
                              width: "100%", 
                              height: "140px", 
                              objectFit: "cover", 
                              borderRadius: "var(--radius-sm)", 
                              border: "1px solid var(--border)" 
                            }} 
                          />
                        ) : (
                          <div 
                            style={{ 
                              width: "100%", 
                              height: "140px", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              background: "rgba(0,0,0,0.25)", 
                              borderRadius: "var(--radius-sm)", 
                              fontSize: "12px", 
                              color: "var(--text-muted)",
                              border: "1px dashed var(--border)"
                            }}
                          >
                            📄 Non-image Document File
                          </div>
                        )}
                        <a 
                          href={fileUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className={styles.btn} 
                          style={{ 
                            textAlign: "center", 
                            width: "100%", 
                            textDecoration: "none", 
                            fontSize: "12px", 
                            padding: "6px 0",
                            marginTop: "auto"
                          }}
                        >
                          View Full Document
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prompt Actions */}
            {showRejectPrompt && (
              <div style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid var(--danger)", padding: "16px", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <strong style={{ fontSize: "14px", color: "var(--danger)" }}>Reject KYC Verification</strong>
                <textarea 
                  placeholder="Specify the reason why this user registration or KYC is rejected..." 
                  value={rejectionReason} 
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ width: "100%", padding: "10px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text)", minHeight: "80px", resize: "vertical" }}
                />
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button className={styles.btnSecondary} onClick={() => setShowRejectPrompt(false)} disabled={actionLoading}>Cancel</button>
                  <button className={styles.btn} onClick={() => void handleRejectKYC(readNumber(activeUser.id))} disabled={actionLoading} style={{ backgroundColor: "var(--danger)", color: "#fff" }}>Confirm Rejection</button>
                </div>
              </div>
            )}

            {showBanPrompt && (
              <div style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid var(--danger)", padding: "16px", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <strong style={{ fontSize: "14px", color: "var(--danger)" }}>Ban / Block User Account</strong>
                <textarea 
                  placeholder="Specify the reason why this user account is being banned..." 
                  value={banReason} 
                  onChange={(e) => setBanReason(e.target.value)}
                  style={{ width: "100%", padding: "10px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text)", minHeight: "80px", resize: "vertical" }}
                />
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button className={styles.btnSecondary} onClick={() => setShowBanPrompt(false)} disabled={actionLoading}>Cancel</button>
                  <button className={styles.btn} onClick={() => void handleBanUser(readNumber(activeUser.id))} disabled={actionLoading} style={{ backgroundColor: "var(--danger)", color: "#fff" }}>Confirm Ban</button>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              {/* Account State Modifier */}
              <div style={{ display: "flex", gap: "10px" }}>
                {readString(activeUser.verificationStatus) !== "BLOCKED" && (
                  <button 
                    className={styles.btnSecondary} 
                    onClick={() => {
                      setShowBanPrompt(true);
                      setShowRejectPrompt(false);
                    }}
                    disabled={actionLoading || showBanPrompt}
                  >
                    Ban Account
                  </button>
                )}
                {readString(activeUser.verificationStatus) !== "BLOCKED" && (
                  <button 
                    className={styles.btnSecondary} 
                    onClick={() => void handleSuspendUser(readNumber(activeUser.id), readString(activeUser.verificationStatus))}
                    disabled={actionLoading}
                  >
                    {readString(activeUser.verificationStatus) === "SUSPENDED" ? "Activate Account" : "Suspend Account"}
                  </button>
                )}
              </div>

              {/* KYC Decisions */}
              <div style={{ display: "flex", gap: "10px" }}>
                {(readString(activeUser.verificationStatus) === "PENDING" || readString(activeUser.verificationStatus) === "REJECTED") && !showRejectPrompt && (
                  <button 
                    className={styles.btnSecondary} 
                    onClick={() => {
                      setShowRejectPrompt(true);
                      setShowBanPrompt(false);
                    }}
                    style={{ border: "1px solid var(--danger)", color: "var(--danger)" }}
                    disabled={actionLoading}
                  >
                    Reject KYC
                  </button>
                )}
                {(readString(activeUser.verificationStatus) === "PENDING" || readString(activeUser.verificationStatus) === "REJECTED") && (
                  <button 
                    className={styles.btn} 
                    onClick={() => void handleApproveKYC(readNumber(activeUser.id))}
                    style={{ backgroundColor: "var(--accent)", color: "#0d1117" }}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "Approve KYC"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

