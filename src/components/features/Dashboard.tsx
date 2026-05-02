import React from "react";
import styles from "@/app/page.module.css";
import { AdminData } from "@/types/admin";
import { readNumber } from "@/lib/utils";

export type DashboardProps = {
  data: AdminData;
};

export default function Dashboard({ data }: DashboardProps) {
  const dashboard = data.dashboard ?? {};
  const paymentTotals = dashboard.payments ?? {};
  const codCount = paymentTotals.COD?.count ?? paymentTotals.cod?.count ?? 0;
  const stripeCount = paymentTotals.STRIPE?.count ?? paymentTotals.stripe?.count ?? 0;
  const totalPayments = codCount + stripeCount;
  const codPercent = totalPayments ? Math.round((codCount / totalPayments) * 100) : 50;
  const stripePercent = totalPayments ? 100 - codPercent : 50;

  const roles = dashboard.roles ?? {};
  const roleValues = [
    { role: "Individuals", value: readNumber(roles.individual), color: "#30d98b" },
    { role: "Warehouses", value: readNumber(roles.warehouse), color: "#f0b429" },
    { role: "Companies", value: readNumber(roles.company), color: "#f85149" },
    { role: "Collectors", value: readNumber(roles.collector), color: "#58a6ff" },
  ];
  const roleTotal = roleValues.reduce((sum, item) => sum + item.value, 0);
  const roleSplit = roleTotal
    ? roleValues.map((item) => ({ ...item, value: Math.round((item.value / roleTotal) * 100) }))
    : roleValues.map((item) => ({ ...item, value: 25 }));

  const conic = `conic-gradient(${roleSplit
    .reduce((acc, item) => { 
      const start = acc.total; 
      const end = acc.total + item.value; 
      acc.parts.push(`${item.color} ${start}% ${end}%`); 
      acc.total = end; 
      return acc; 
    }, { total: 0, parts: [] as string[] })
    .parts.join(", ")})`;

  const stats = [
    { label: "Total users", value: readNumber(dashboard.users, data.users.length).toLocaleString(), detail: "All registered platform users" },
    { label: "Total orders", value: readNumber(dashboard.orders?.total, data.orders.length).toLocaleString(), detail: `${readNumber(dashboard.orders?.completed)} completed` },
    { label: "Waste processed", value: `${readNumber(dashboard.totalProcessedKg).toLocaleString()} kg`, detail: "Total weight from completed orders" },
    { label: "Revenue", value: `PKR ${readNumber(dashboard.revenue).toLocaleString()}`, detail: "From transaction aggregation" },
  ];

  const alerts = [
    { title: "Suspended users", meta: `${readNumber(dashboard.alerts?.suspendedUsers)} accounts restricted`, level: "Risk", color: "var(--danger)" },
    { title: "Cancelled orders", meta: `${readNumber(dashboard.alerts?.cancelledOrders)} cancelled orders`, level: "Ops", color: "var(--warning)" },
    { title: "Open disputes", meta: `${readNumber(dashboard.alerts?.openDisputes)} disputes`, level: "Case", color: "var(--info)" },
  ];

  const wasteMix = [
    { label: "Plastic", value: 86 },
    { label: "Metal", value: 64 },
    { label: "Paper", value: 51 },
    { label: "E-waste", value: 33 },
  ];

  return (
    <>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>RecyConnect Command Center</p>
        <h2>Monitor users, orders, payments and recyclable pricing from one dashboard.</h2>
        <p>Real-time data from your RecyConnect backend with live API integration.</p>
      </section>

      <section className={styles.statsGrid}>
        {stats.map((stat) => (
          <article className={styles.statCard} key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader} style={{ padding: 0, border: "none" }}>
            <div><p className={styles.eyebrow}>Payments</p><h3>COD vs Stripe</h3></div>
            <span className={styles.badge}>Live</span>
          </div>
          <div className={styles.paymentSplit}>
            <div><strong>{codPercent}%</strong><span>COD orders</span></div>
            <div><strong>{stripePercent}%</strong><span>Stripe orders</span></div>
          </div>
          <div className={styles.progressTrack}><span style={{ width: `${codPercent}%` }} /></div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader} style={{ padding: 0, border: "none" }}>
            <div><p className={styles.eyebrow}>Active alerts</p><h3>Risk queue</h3></div>
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

        <article className={styles.panel}>
          <div className={styles.panelHeader} style={{ padding: 0, border: "none" }}>
            <div><p className={styles.eyebrow}>Users</p><h3>Role distribution</h3></div>
          </div>
          <div className={styles.donutWrap}>
            <div className={styles.donut} style={{ background: conic }} />
            <div className={styles.legend}>
              {roleSplit.map((item) => (
                <span key={item.role}><i style={{ background: item.color }} />{item.role} {item.value}%</span>
              ))}
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader} style={{ padding: 0, border: "none" }}>
            <div><p className={styles.eyebrow}>Recycling</p><h3>Category breakdown</h3></div>
          </div>
          <div className={styles.barChart}>
            {wasteMix.map((item) => (
              <div key={item.label}><span>{item.label}</span><div><i style={{ width: `${item.value}%` }} /></div><b>{item.value}t</b></div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
