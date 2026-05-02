import React from "react";
import styles from "@/app/page.module.css";
import { ApiRecord } from "@/types/admin";
import { readString, readNumber, formatDate } from "@/lib/utils";

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
  const filteredUsers = users.filter((u) => {
    if (userRoleFilter && readString(u.role) !== userRoleFilter) return false;
    if (userSearch) {
      const name = readString(u.name, "").toLowerCase();
      const email = readString(u.email, "").toLowerCase();
      if (!name.includes(userSearch.toLowerCase()) && !email.includes(userSearch.toLowerCase())) return false;
    }
    return true;
  });

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
            <span>👥</span>
            <strong>No users found</strong>
            <p>No users match current filters.</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const status = readString(user.verificationStatus, "PENDING");
            const statusClass = status === "VERIFIED" ? styles.badge : status === "SUSPENDED" ? styles.badgeDanger : styles.badgeWarning;
            return (
              <div className={`${styles.tableRow} ${styles.userGrid}`} key={readNumber(user.id)}>
                <div>
                  <strong>{readString(user.name, "—")}</strong>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{readString(user.email, "—")}</div>
                </div>
                <span className={styles.badgeInfo}>{readString(user.role)}</span>
                <span className={statusClass}>{status}</span>
                <span>{formatDate(user.createdAt)}</span>
                <span>#{readNumber(user.id)}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
