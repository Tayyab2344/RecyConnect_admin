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

/** Extract the first image URL from order items' listing images */
function getOrderImage(order: ApiRecord): string | null {
  const items = order.items as ApiRecord[] | undefined;
  if (!items || items.length === 0) return null;

  for (const item of items) {
    const listing = item.listing as ApiRecord | undefined;
    if (!listing) continue;
    const images = listing.images as string[] | undefined;
    if (images && images.length > 0) {
      return images[0];
    }
  }
  return null;
}

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
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="WAREHOUSE_ASSIGNED">Warehouse Assigned</option>
            <option value="COLLECTOR_ASSIGNED">Collector Assigned</option>
            <option value="COLLECTOR_ACCEPTED">Collector Accepted</option>
            <option value="IN_TRANSIT">In Transit</option>
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
          <span>Product</span><span>ID</span><span>Buyer</span><span>Seller</span><span>Amount</span><span>Status</span><span>Date</span>
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
            const imageUrl = getOrderImage(order);
            const items = order.items as ApiRecord[] | undefined;
            const firstListing = items && items.length > 0 ? (items[0].listing as ApiRecord | undefined) : undefined;

            const statusClass = status === "COMPLETED" || status === "DELIVERED" ? styles.badge
              : status === "CANCELLED" ? styles.badgeDanger
              : ["COLLECTOR_ASSIGNED", "COLLECTOR_ACCEPTED", "IN_TRANSIT", "WAREHOUSE_ASSIGNED"].includes(status) ? styles.badgeInfo
              : styles.badgeWarning;
            return (
              <div className={`${styles.tableRow} ${styles.orderGrid}`} key={readNumber(order.id)}>
                <div className={styles.orderProductCell}>
                  <div className={styles.orderThumb}>
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={readString(firstListing?.title, "Product")}
                        className={styles.orderThumbImg}
                      />
                    ) : (
                      <div className={styles.orderThumbPlaceholder}>📦</div>
                    )}
                  </div>
                  <div className={styles.orderProductInfo}>
                    <strong>{readString(firstListing?.title, "Untitled")}</strong>
                    <span>{readString(firstListing?.category)} • {readString(firstListing?.materialType)}</span>
                  </div>
                </div>
                <strong>RC-{readNumber(order.id)}</strong>
                <div>
                  <span>{readString(buyer?.name || buyer?.businessName || buyer?.companyName, "—")}</span>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{readString(buyer?.role)}</div>
                </div>
                <div>
                  <span>{readString(seller?.name || seller?.businessName || seller?.companyName, "—")}</span>
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
