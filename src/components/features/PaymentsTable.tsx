import React from "react";
import styles from "@/app/page.module.css";
import { ApiRecord } from "@/types/admin";
import { readString, readNumber } from "@/lib/utils";

export type PaymentsTableProps = {
  payments: ApiRecord[];
  loading: boolean;
  paymentStatusFilter: string;
  setPaymentStatusFilter: (val: string) => void;
  loadAdminData: () => Promise<void>;
  token: string;
};

export default function PaymentsTable({
  payments,
  loading,
  paymentStatusFilter,
  setPaymentStatusFilter,
  loadAdminData,
  token
}: PaymentsTableProps) {
  const filteredPayments = payments.filter((p) => {
    if (paymentStatusFilter && readString(p.status) !== paymentStatusFilter) return false;
    return true;
  });

  return (
    <section className={styles.tablePanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderInner}>
          <p className={styles.eyebrow}>Payment Monitoring</p>
          <h3>Transaction Records ({filteredPayments.length})</h3>
        </div>
        <div className={styles.panelActions}>
          <select 
            className={styles.filterSelect} 
            value={paymentStatusFilter} 
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="AUTHORIZE">Authorize</option>
            <option value="CAPTURED">Captured</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <button className={styles.btn} onClick={() => void loadAdminData()} disabled={!token || loading}>Refresh</button>
        </div>
      </div>
      {loading && <div className={styles.loadingBar} />}
      <div className={styles.tableWrap}>
        <div className={`${styles.tableHead} ${styles.paymentGrid}`}>
          <span>ID / Order</span><span>Buyer</span><span>Seller</span><span>Amount</span><span>Provider</span><span>Status</span>
        </div>
        {filteredPayments.length === 0 ? (
          <div className={styles.emptyState}>
            <span>💳</span>
            <strong>No payments found</strong>
            <p>No payments match the current criteria.</p>
          </div>
        ) : (
          filteredPayments.map((payment) => {
            const order = payment.order as ApiRecord | undefined;
            const buyer = order?.buyer as ApiRecord | undefined;
            const seller = order?.seller as ApiRecord | undefined;
            const status = readString(payment.status);
            const provider = readString(payment.provider, "COD");
            const statusClass = status === "COMPLETED" || status === "CAPTURED" ? styles.badge
              : status === "FAILED" || status === "REFUNDED" ? styles.badgeDanger
              : styles.badgeWarning;
            return (
              <div className={`${styles.tableRow} ${styles.paymentGrid}`} key={readNumber(payment.id)}>
                <div>
                  <strong>P-{readNumber(payment.id)}</strong>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Order RC-{readNumber(order?.id)}</div>
                </div>
                <div>
                  <span>{readString(buyer?.name, "—")}</span>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{readString(buyer?.role)}</div>
                </div>
                <div>
                  <span>{readString(seller?.name, "—")}</span>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{readString(seller?.role)}</div>
                </div>
                <strong>PKR {readNumber(payment.amount).toLocaleString()}</strong>
                <span className={provider === "STRIPE" ? styles.badgeInfo : styles.badgeDark}>{provider}</span>
                <span className={statusClass}>{status}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
