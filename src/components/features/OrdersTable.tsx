import React from "react";
import styles from "@/app/page.module.css";
import { ApiRecord } from "@/types/admin";
import { readString, readNumber, formatDate } from "@/lib/utils";

export type OrdersTableProps = {
  orders: ApiRecord[];
  loading: boolean;
  orderStatusFilter: string;
  setOrderStatusFilter: (val: string) => void;
  loadAdminData: () => Promise<void>;
  token: string;
};

export default function OrdersTable({
  orders,
  loading,
  orderStatusFilter,
  setOrderStatusFilter,
  loadAdminData,
  token
}: OrdersTableProps) {
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter && readString(o.status) !== orderStatusFilter) return false;
    return true;
  });

  return (
    <section className={styles.tablePanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderInner}>
          <p className={styles.eyebrow}>Order Management</p>
          <h3>All Orders ({filteredOrders.length})</h3>
        </div>
        <div className={styles.panelActions}>
          <select 
            className={styles.filterSelect} 
            value={orderStatusFilter} 
            onChange={(e) => setOrderStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="CREATED">Created</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button className={styles.btn} onClick={() => void loadAdminData()} disabled={!token || loading}>Refresh</button>
        </div>
      </div>
      {loading && <div className={styles.loadingBar} />}
      <div className={styles.tableWrap}>
        <div className={`${styles.tableHead} ${styles.orderGrid}`}>
          <span>ID</span><span>Buyer</span><span>Seller</span><span>Amount</span><span>Status</span><span>Date</span>
        </div>
        {filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <span>📦</span>
            <strong>No orders found</strong>
            <p>No orders match current filters.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const buyer = order.buyer as ApiRecord | undefined;
            const seller = order.seller as ApiRecord | undefined;
            const status = readString(order.status);
            const statusClass = status === "COMPLETED" || status === "DELIVERED" ? styles.badge
              : status === "CANCELLED" ? styles.badgeDanger
              : status === "PROCESSING" || status === "SHIPPED" ? styles.badgeInfo
              : styles.badgeWarning;
            return (
              <div className={`${styles.tableRow} ${styles.orderGrid}`} key={readNumber(order.id)}>
                <strong>RC-{readNumber(order.id)}</strong>
                <div>
                  <span>{readString(buyer?.name, "—")}</span>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{readString(buyer?.role)}</div>
                </div>
                <div>
                  <span>{readString(seller?.name, "—")}</span>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{readString(seller?.role)}</div>
                </div>
                <span>PKR {readNumber(order.totalAmount).toLocaleString()}</span>
                <span className={statusClass}>{status}</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
