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
  const [viewMode, setViewMode] = useState<"analytics" | "spreadsheet">("analytics");
  
  // Spreadsheet filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const dashboard = data.dashboard ?? {};
  const analytics = dashboard.analytics ?? {};
  
  // Active statistics based on selected timeframe
  const activeAnalytics = analytics[timeframe] ?? {
    buyValue: timeframe === "day" ? 1500 : timeframe === "week" ? 12000 : timeframe === "month" ? 48000 : 580000,
    sellValue: timeframe === "day" ? 1950 : timeframe === "week" ? 15600 : timeframe === "month" ? 62400 : 754000,
    volume: timeframe === "day" ? 45 : timeframe === "week" ? 360 : timeframe === "month" ? 1440 : 17280
  };

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
  const codPercent = totalPayments ? Math.round((codCount / totalPayments) * 100) : 50;
  const stripePercent = totalPayments ? 100 - codPercent : 50;

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

  // ERP CSV exporter
  const handleExportCSV = () => {
    const headers = ["Order ID", "Date", "Buyer", "Seller", "Delivery Method", "Weight (kg)", "Total Amount (PKR)", "Status"];
    const rows = (data.orders || []).map((order: any) => [
      order.id,
      new Date(order.createdAt).toLocaleDateString(),
      order.buyer?.name || "N/A",
      order.seller?.name || "N/A",
      order.deliveryMethod || "N/A",
      order.items?.[0]?.quantity || 0,
      order.totalAmount || 0,
      order.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RecyConnect_ERP_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ERP PDF printer
  const handleExportPDF = () => {
    window.print();
  };

  // Spreadsheet filter logic
  const filteredOrders = (data.orders || []).filter((order: any) => {
    const buyerName = (order.buyer?.name || "").toLowerCase();
    const sellerName = (order.seller?.name || "").toLowerCase();
    const matchesSearch = buyerName.includes(searchQuery.toLowerCase()) || sellerName.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFilteredWeight = filteredOrders.reduce((sum, order: any) => sum + (order.items?.[0]?.quantity || 0), 0);
  const totalFilteredValue = filteredOrders.reduce((sum, order: any) => sum + (order.totalAmount || 0), 0);

  return (
    <>
      <section className={styles.hero} style={{ padding: "28px", borderRadius: "var(--radius-lg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p className={styles.eyebrow} style={{ color: "var(--accent)", fontWeight: 800 }}>RecyConnect Command Center</p>
            <h2 style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-0.5px" }}>Next-Gen ERP Analytics Dashboard</h2>
            <p style={{ marginTop: "4px" }}>Monitor trading, user demographics, profit margins, and processed waste.</p>
          </div>
          
          <div style={{ display: "flex", gap: "10px", background: "var(--bg-input)", padding: "4px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <button 
              onClick={() => setViewMode("analytics")}
              style={{
                background: viewMode === "analytics" ? "var(--bg-card)" : "transparent",
                border: "none",
                color: viewMode === "analytics" ? "var(--accent)" : "var(--text-muted)",
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all var(--transition)"
              }}
            >
              📊 Analytics
            </button>
            <button 
              onClick={() => setViewMode("spreadsheet")}
              style={{
                background: viewMode === "spreadsheet" ? "var(--bg-card)" : "transparent",
                border: "none",
                color: viewMode === "spreadsheet" ? "var(--accent)" : "var(--text-muted)",
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all var(--transition)"
              }}
            >
              📋 ERP Spreadsheet
            </button>
          </div>
        </div>
      </section>

      {viewMode === "analytics" ? (
        <>
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
            <article className={styles.statCard} style={{ borderLeft: "3.5px solid var(--info)" }}>
              <span>Total Waste Buying (Inflow)</span>
              <strong style={{ color: "var(--info)" }}>PKR {buyValue.toLocaleString()}</strong>
              <p>Purchases by warehouses from sellers</p>
            </article>

            <article className={styles.statCard} style={{ borderLeft: "3.5px solid var(--accent)" }}>
              <span>Total Waste Selling (Outflow)</span>
              <strong style={{ color: "var(--accent)" }}>PKR {sellValue.toLocaleString()}</strong>
              <p>Sales to industrial recyclers (+30% margin)</p>
            </article>

            <article className={styles.statCard} style={{ borderLeft: "3.5px solid var(--purple)" }}>
              <span>Gross Margin Profit</span>
              <strong style={{ color: "var(--purple)" }}>PKR {profitValue.toLocaleString()}</strong>
              <p>Earned markup: <strong>{profitMarginPercent}%</strong></p>
            </article>

            <article className={styles.statCard} style={{ borderLeft: "3.5px solid var(--warning)" }}>
              <span>Waste Processed</span>
              <strong style={{ color: "var(--warning)" }}>{volumeValue.toLocaleString()} kg</strong>
              <p>Active trading volume in period</p>
            </article>
          </section>

          {/* Visual Data Comparison & Demographics */}
          <section className={styles.contentGrid}>
            <article className={styles.panel} style={{ background: "linear-gradient(180deg, var(--bg-card) 0%, rgba(20,24,34,0.3) 100%)" }}>
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
                    <strong style={{ color: "var(--info)" }}>PKR {buyValue.toLocaleString()}</strong>
                  </div>
                  <div style={{ height: "14px", background: "var(--bg-input)", borderRadius: "6px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        height: "100%", 
                        width: buyValue ? "100%" : "0%", 
                        background: "linear-gradient(90deg, #2563eb, #58a6ff)",
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
                        background: "linear-gradient(90deg, #16a34a, #30d98b)",
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
                    <h4 style={{ fontSize: "20px", fontWeight: 800, color: "var(--purple)" }}>{profitMarginPercent}%</h4>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>Processed Volume</span>
                    <h4 style={{ fontSize: "20px", fontWeight: 800, color: "var(--warning)" }}>{volumeValue} kg</h4>
                  </div>
                </div>
              </div>
            </article>

            {/* Demographics / Roles */}
            <article className={styles.panel}>
              <div className={styles.panelHeader} style={{ padding: 0, border: "none" }}>
                <div><p className={styles.eyebrow}>Users</p><h3 style={{ fontSize: "16px" }}>Role Distribution Split</h3></div>
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
              <div className={styles.paymentSplit} style={{ margin: "10px 0" }}>
                <div><strong>{codPercent}%</strong><span>COD orders</span></div>
                <div><strong>{stripePercent}%</strong><span>Stripe orders</span></div>
              </div>
              <div className={styles.progressTrack}><span style={{ width: `${codPercent}%` }} /></div>
            </article>
          </section>
        </>
      ) : (
        /* ERP SPREADSHEET MODE */
        <article className={styles.tablePanel} style={{ padding: "20px", borderRadius: "var(--radius-lg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div>
              <p className={styles.eyebrow}>Spreadsheet Mode</p>
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>RecyConnect Active Order Ledger</h3>
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleExportCSV} className={`${styles.btn} ${styles.btnSmall}`} style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
                📥 Export CSV Spreadsheet
              </button>
              <button onClick={handleExportPDF} className={`${styles.btn} ${styles.btnSmall}`} style={{ borderColor: "var(--purple)", color: "var(--purple)" }}>
                🖨️ Print Executive Report
              </button>
            </div>
          </div>

          {/* Filtering row */}
          <div className={styles.searchBar} style={{ marginBottom: "18px", paddingBottom: "18px", borderBottom: "1px solid var(--border)" }}>
            <input 
              type="text" 
              placeholder="Search Buyer or Seller..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, maxWidth: "320px" }}
            />
            <select 
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="CREATED">Created</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <div style={{ marginLeft: "auto", fontSize: "13px", color: "var(--text-muted)", display: "flex", gap: "16px" }}>
              <span>Ledger Count: <strong style={{ color: "var(--text)" }}>{filteredOrders.length}</strong></span>
              <span>Weight: <strong style={{ color: "var(--warning)" }}>{totalFilteredWeight.toLocaleString()} kg</strong></span>
              <span>Amount: <strong style={{ color: "var(--accent)" }}>PKR {totalFilteredValue.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Grid spreadsheet */}
          <div className={styles.tableWrap}>
            <div className={styles.tableHead} style={{ gridTemplateColumns: "0.8fr 1fr 1.5fr 1.5fr 1.5fr 1fr 1.2fr 1fr" }}>
              <div>ID</div>
              <div>Date</div>
              <div>Seller</div>
              <div>Buyer</div>
              <div>Delivery Method</div>
              <div>Weight</div>
              <div>Amount</div>
              <div>Status</div>
            </div>

            {filteredOrders.length > 0 ? (
              filteredOrders.map((order: any) => {
                const orderWeight = order.items?.[0]?.quantity || 0;
                return (
                  <div 
                    className={styles.tableRow} 
                    key={order.id} 
                    style={{ 
                      gridTemplateColumns: "0.8fr 1fr 1.5fr 1.5fr 1.5fr 1fr 1.2fr 1fr",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "13px"
                    }}
                  >
                    <div style={{ color: "var(--accent)", fontWeight: 700 }}>#{order.id}</div>
                    <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontWeight: 600 }}>{order.seller?.name || "N/A"}</div>
                    <div style={{ fontWeight: 600 }}>{order.buyer?.name || "N/A"}</div>
                    <div style={{ color: "var(--text-dim)" }}>
                      {order.deliveryMethod === "WAREHOUSE_COLLECTOR_SERVICE" ? "🚚 Collector" : "📦 Self Trans."}
                    </div>
                    <div style={{ fontWeight: 600, color: "var(--warning)" }}>{orderWeight} kg</div>
                    <div style={{ fontWeight: 700 }}>PKR {order.totalAmount?.toLocaleString()}</div>
                    <div>
                      <span 
                        className={
                          order.status === "COMPLETED" 
                            ? styles.badge 
                            : order.status === "CANCELLED" 
                              ? styles.badgeDanger 
                              : styles.badgeWarning
                        }
                        style={{ fontSize: "9px", padding: "2px 6px" }}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                <span>📭</span>
                <strong>No active matching orders in the ledger</strong>
                <p>Try clearing your search filters or status tags.</p>
              </div>
            )}
          </div>
        </article>
      )}
    </>
  );
}
