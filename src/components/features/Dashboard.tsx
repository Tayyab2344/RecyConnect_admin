"use client";

import React, { useState } from "react";
import styles from "@/app/page.module.css";
import { AdminData } from "@/types/admin";
import { readNumber } from "@/lib/utils";

export type DashboardProps = {
  data: AdminData;
};

type Timeframe = "day" | "week" | "month" | "year";

export default function Dashboard({ data }: DashboardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");

  const dashboard = data.dashboard ?? {};
  const analytics = dashboard.analytics ?? {};
  
  // Helper to calculate statistics dynamically from live orders list in case backend aggregations are empty
  const calculateStats = (ordersList: any[], period: Timeframe) => {
    const now = new Date();
    const cutoff = new Date();
    if (period === "day") cutoff.setDate(now.getDate() - 1);
    else if (period === "week") cutoff.setDate(now.getDate() - 7);
    else if (period === "month") cutoff.setDate(now.getDate() - 30);
    else if (period === "year") cutoff.setDate(now.getDate() - 365);

    const completed = ordersList.filter((o: any) => {
      const date = new Date(o.createdAt);
      return o.status === "COMPLETED" && date >= cutoff;
    });

    let buyValue = 0;
    let volume = 0;
    for (const order of completed) {
      buyValue += Number(order.totalAmount || 0);
      const qty = order.items?.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0) || 0;
      volume += qty;
    }
    const sellValue = Math.round(buyValue * 1.3); // +30% margin
    return { buyValue, sellValue, volume };
  };

  // Active statistics based on selected timeframe
  const backendStats = analytics[timeframe];
  const hasBackendStats = backendStats && (backendStats.buyValue || backendStats.sellValue || backendStats.volume);
  const activeAnalytics = hasBackendStats ? backendStats : calculateStats(data.orders || [], timeframe);

  const buyValue = activeAnalytics.buyValue || 0;
  const sellValue = activeAnalytics.sellValue || 0;
  const volumeValue = activeAnalytics.volume || 0;
  const profitValue = Math.max(0, sellValue - buyValue);
  const profitMarginPercent = sellValue ? Math.round((profitValue / sellValue) * 100) : 0;

  // Payments split
  const paymentTotals = dashboard.payments ?? {};
  const codCount = paymentTotals.COD?.count ?? paymentTotals.cod?.count ?? 0;
  const stripeCount = paymentTotals.STRIPE?.count ?? paymentTotals.stripe?.count ?? 0;
  const totalPayments = codCount + stripeCount;
  const codPercent = totalPayments ? Math.round((codCount / totalPayments) * 100) : 0;
  const stripePercent = totalPayments ? 100 - codPercent : 0;

  // Alerts
  const alerts = [
    { title: "Suspended users", meta: `${readNumber(dashboard.alerts?.suspendedUsers)} accounts restricted`, level: "Risk", color: "var(--danger)" },
    { title: "Cancelled orders", meta: `${readNumber(dashboard.alerts?.cancelledOrders)} cancelled orders`, level: "Ops", color: "var(--warning)" },
    { title: "Open disputes", meta: `${readNumber(dashboard.alerts?.openDisputes)} disputes`, level: "Case", color: "var(--info)" },
  ];

  // Role distribution donut background
  const roles = dashboard.roles ?? {};
  const roleValues = [
    { role: "Individuals", value: readNumber(roles.individual), color: "#30d98b" },
    { role: "Warehouses", value: readNumber(roles.warehouse), color: "#22c55e" },
    { role: "Companies", value: readNumber(roles.company), color: "#a7f3d0" },
    { role: "Collectors", value: readNumber(roles.collector), color: "#e6edf3" },
  ];
  const roleTotal = roleValues.reduce((sum, item) => sum + item.value, 0);
  const roleSplit = roleTotal
    ? roleValues.map((item) => ({ ...item, value: Math.round((item.value / roleTotal) * 100) }))
    : roleValues.map((item) => ({ ...item, value: 0 }));

  const conic = `conic-gradient(${roleSplit
    .reduce((acc, item) => { 
      const start = acc.total; 
      const end = acc.total + item.value; 
      acc.parts.push(`${item.color} ${start}% ${end}%`); 
      acc.total = end; 
      return acc; 
    }, { total: 0, parts: [] as string[] })
    .parts.join(", ")})`;



  return (
    <>
      <section className={styles.hero} style={{ padding: "28px", borderRadius: "var(--radius-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p className={styles.eyebrow} style={{ color: "var(--accent)", fontWeight: 800 }}>RecyConnect ERP Portal</p>
            <h2 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.5px" }}>RecyConnect ERP Dashboard</h2>
            <p style={{ marginTop: "4px" }}>Monitor recycling transactions, user accounts, system metrics, and waste throughput.</p>
          </div>
        </div>
      </section>

          {/* Timeline Period Selector */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.2px" }}>Financial Analytics</h3>
            <div style={{ display: "flex", gap: "6px", background: "var(--bg-card)", padding: "3px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              {(["day", "week", "month", "year"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  style={{
                    background: timeframe === period ? "var(--accent-bg)" : "transparent",
                    color: timeframe === period ? "var(--accent)" : "var(--text-muted)",
                    border: "none",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all var(--transition)"
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Aggregated Trade Metric Cards */}
          <section className={styles.statsGrid}>
            <article className={styles.statCard} style={{ borderLeft: "3.5px solid var(--text-dim)" }}>
              <span>Total Waste Buying (Inflow)</span>
              <strong style={{ color: "var(--text)" }}>PKR {buyValue.toLocaleString()}</strong>
              <p>Purchases by warehouses from sellers</p>
            </article>

            <article className={styles.statCard} style={{ borderLeft: "3.5px solid var(--accent)" }}>
              <span>Total Waste Selling (Outflow)</span>
              <strong style={{ color: "var(--accent)" }}>PKR {sellValue.toLocaleString()}</strong>
              <p>Sales to industrial recyclers (+30% margin)</p>
            </article>

            <article className={styles.statCard} style={{ borderLeft: "3.5px solid var(--accent)" }}>
              <span>Gross Margin Profit</span>
              <strong style={{ color: "var(--accent)" }}>PKR {profitValue.toLocaleString()}</strong>
              <p>Earned markup: <strong>{profitMarginPercent}%</strong></p>
            </article>

            <article className={styles.statCard} style={{ borderLeft: "3.5px solid var(--text-dim)" }}>
              <span>Waste Processed</span>
              <strong style={{ color: "var(--text)" }}>{volumeValue.toLocaleString()} kg</strong>
              <p>Active trading volume in period</p>
            </article>
          </section>

          {/* Visual Data Comparison & Demographics */}
          <section className={styles.contentGrid}>
            <article className={styles.panel} style={{ background: "linear-gradient(180deg, var(--bg-card) 0%, var(--bg) 100%)" }}>
              <div className={styles.panelHeader} style={{ padding: 0, border: "none" }}>
                <div>
                  <p className={styles.eyebrow}>ERP Value Analysis</p>
                  <h3 style={{ fontSize: "16px" }}>Buying vs Selling Comparison ({timeframe})</h3>
                </div>
                <span className={styles.badge} style={{ background: "rgba(167, 139, 250, 0.12)", color: "var(--purple)" }}>
                  PKR {profitValue.toLocaleString()} profit
                </span>
              </div>
              
              <div style={{ display: "grid", gap: "18px", marginTop: "10px" }}>
                {/* Purchase Bar */}
                <div style={{ display: "grid", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
                    <span>Buying Cost (Warehouse Input)</span>
                    <strong style={{ color: "var(--text)" }}>PKR {buyValue.toLocaleString()}</strong>
                  </div>
                  <div style={{ height: "14px", background: "var(--bg-input)", borderRadius: "6px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        height: "100%", 
                        width: buyValue ? "100%" : "0%", 
                        background: "linear-gradient(90deg, var(--text-dim), var(--text))",
                        borderRadius: "inherit",
                        transition: "width 500ms ease"
                      }} 
                    />
                  </div>
                </div>

                {/* Sales Bar */}
                <div style={{ display: "grid", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
                    <span>Selling Value (Market Outflow)</span>
                    <strong style={{ color: "var(--accent)" }}>PKR {sellValue.toLocaleString()}</strong>
                  </div>
                  <div style={{ height: "14px", background: "var(--bg-input)", borderRadius: "6px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        height: "100%", 
                        width: buyValue && sellValue ? `${Math.min(100, Math.round((sellValue / (buyValue || 1)) * 75))}%` : "0%", 
                        background: "linear-gradient(90deg, #22c55e, #30d98b)",
                        borderRadius: "inherit",
                        transition: "width 500ms ease"
                      }} 
                    />
                  </div>
                </div>

                {/* Profit/Margin indicators */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>Est. Profit Margin</span>
                    <h4 style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent)" }}>{profitMarginPercent}%</h4>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>Processed Volume</span>
                    <h4 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>{volumeValue} kg</h4>
                  </div>
                </div>
              </div>
            </article>

            {/* Demographics / Roles */}
            <article className={styles.panel}>
              <div className={styles.panelHeader} style={{ padding: 0, border: "none" }}>
                <div><p className={styles.eyebrow}>Users</p><h3 style={{ fontSize: "16px" }}>Role Distribution Split</h3></div>
              </div>
              {roleTotal > 0 ? (
                <div className={styles.donutWrap}>
                  <div className={styles.donut} style={{ background: conic }} />
                  <div className={styles.legend}>
                    {roleSplit.map((item) => (
                      <span key={item.role}><i style={{ background: item.color }} />{item.role} {item.value}%</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-dim)", display: "grid", gap: "8px" }}>
                  <span style={{ fontSize: "28px" }}>👥</span>
                  <strong>No registered users yet</strong>
                  <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>Demographics split will show once users register.</p>
                </div>
              )}
            </article>

            {/* Alerts Risk Queue */}
            <article className={styles.panel}>
              <div className={styles.panelHeader} style={{ padding: 0, border: "none" }}>
                <div><p className={styles.eyebrow}>Active Alerts</p><h3 style={{ fontSize: "16px" }}>Risk Management</h3></div>
                <span className={styles.badgeDanger}>{alerts.length} open</span>
              </div>
              <div className={styles.alertList}>
                {alerts.map((alert) => (
                  <div className={styles.alertItem} key={alert.title}>
                    <span style={{ background: `${alert.color}20`, color: alert.color }}>{alert.level}</span>
                    <div><strong>{alert.title}</strong><p>{alert.meta}</p></div>
                  </div>
                ))}
              </div>
            </article>

            {/* Payments Type */}
            <article className={styles.panel}>
              <div className={styles.panelHeader} style={{ padding: 0, border: "none" }}>
                <div><p className={styles.eyebrow}>Payments</p><h3 style={{ fontSize: "16px" }}>COD vs Stripe Volume</h3></div>
                <span className={styles.badge}>Live</span>
              </div>
              {totalPayments > 0 ? (
                <>
                  <div className={styles.paymentSplit} style={{ margin: "10px 0" }}>
                    <div><strong>{codPercent}%</strong><span>COD orders</span></div>
                    <div><strong>{stripePercent}%</strong><span>Stripe orders</span></div>
                  </div>
                  <div className={styles.progressTrack}><span style={{ width: `${codPercent}%`, background: "linear-gradient(90deg, var(--accent), #22c55e)" }} /></div>
                </>
              ) : (
                <div style={{ padding: "34px 0", textAlign: "center", color: "var(--text-dim)", display: "grid", gap: "8px" }}>
                  <span style={{ fontSize: "28px" }}>💳</span>
                  <strong>No payment transactions yet</strong>
                  <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>Payment ratios will appear with processed orders.</p>
                </div>
              )}
            </article>
          </section>
    </>
  );
}
