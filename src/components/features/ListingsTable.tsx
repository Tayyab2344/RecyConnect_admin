import React from "react";
import styles from "@/app/page.module.css";
import { ApiRecord } from "@/types/admin";
import { readString, readNumber, formatDate } from "@/lib/utils";

export type ListingsTableProps = {
  listings: ApiRecord[];
  loading: boolean;
  listingStatusFilter: string;
  setListingStatusFilter: (val: string) => void;
  loadAdminData: () => Promise<void>;
  token: string;
};

export default function ListingsTable({
  listings,
  loading,
  listingStatusFilter,
  setListingStatusFilter,
  loadAdminData,
  token
}: ListingsTableProps) {
  const filteredListings = listings.filter((l) => {
    if (listingStatusFilter && readString(l.status) !== listingStatusFilter) return false;
    return true;
  });

  return (
    <section className={styles.tablePanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderInner}>
          <p className={styles.eyebrow}>Marketplace Moderation</p>
          <h3>All Listings ({filteredListings.length})</h3>
        </div>
        <div className={styles.panelActions}>
          <select 
            className={styles.filterSelect} 
            value={listingStatusFilter} 
            onChange={(e) => setListingStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button className={styles.btn} onClick={() => void loadAdminData()} disabled={!token || loading}>Refresh</button>
        </div>
      </div>
      {loading && <div className={styles.loadingBar} />}
      <div className={styles.tableWrap}>
        <div className={`${styles.tableHead} ${styles.listingGrid}`}>
          <span>Item Details</span><span>Seller</span><span>Weight/Qty</span><span>Status</span><span>Date</span>
        </div>
        {filteredListings.length === 0 ? (
          <div className={styles.emptyState}>
            <span>🏪</span>
            <strong>No listings found</strong>
            <p>No listings match the current criteria.</p>
          </div>
        ) : (
          filteredListings.map((listing) => {
            const user = listing.user as ApiRecord | undefined;
            const status = readString(listing.status);
            const statusClass = status === "PUBLISHED" ? styles.badge 
              : status === "RESERVED" || status === "SOLD" ? styles.badgeInfo 
              : status === "CANCELLED" ? styles.badgeDanger 
              : styles.badgeDark;
              
            return (
              <div className={`${styles.tableRow} ${styles.listingGrid}`} key={readNumber(listing.id)}>
                <div>
                  <strong style={{ display: "block", marginBottom: "4px" }}>{readString(listing.title, "Untitled")}</strong>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{readString(listing.category)} • {readString(listing.materialType)}</div>
                </div>
                <div>
                  <span>{readString(user?.name || user?.businessName || user?.companyName, "—")}</span>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{readString(user?.email)}</div>
                </div>
                <div>
                  <strong>{readNumber(listing.estimatedWeight, 0)} kg</strong>
                  <span style={{ marginLeft: "8px", fontSize: "13px" }}>@ PKR {readNumber(listing.price)}/kg</span>
                </div>
                <div><span className={statusClass}>{status}</span></div>
                <span>{formatDate(listing.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
