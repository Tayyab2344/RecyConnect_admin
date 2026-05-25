"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";

// Hooks & Utils
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { fetchJson } from "@/lib/api";
import { AdminData, emptyData, Section, RateItem } from "@/types/admin";
import { unwrapArray } from "@/lib/utils";

// Layout Components
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

// Auth & Feature Components
import Login from "@/components/auth/Login";
import Dashboard from "@/components/features/Dashboard";
import UsersTable from "@/components/features/UsersTable";
import OrdersTable from "@/components/features/OrdersTable";
import PaymentsTable from "@/components/features/PaymentsTable";
import ListingsTable from "@/components/features/ListingsTable";
import RatesManager from "@/components/features/RatesManager";
import LogsTable from "@/components/features/LogsTable";
import ComplaintsTable from "@/components/features/ComplaintsTable";
import Observability from "@/components/features/Observability";

export default function Home() {
  const auth = useAdminAuth();

  // App State
  const [data, setData] = useState<AdminData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [connection, setConnection] = useState("");
  const [activeSection, setActiveSection] = useState<Section>("dashboard");

  // Filter States
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState("");

  /* ─── Data Engine ─── */
  const loadAdminData = useCallback(async (activeToken?: string) => {
    const _token = activeToken || auth.token;
    if (!_token) return;
    setLoading(true);
    setConnection("Loading live RecyConnect data...");

    const endpoints = {
      dashboard: "/admin/dashboard",
      users: "/admin/users",
      orders: "/admin/orders?limit=50",
      payments: "/admin/payments?limit=50",
      listings: "/admin/listings?limit=50",
      rates: "/admin/rates",
      logs: "/admin/logs?limit=50",
      complaints: "/admin/complaints?limit=50",
    };

    const results = await Promise.allSettled(
      Object.entries(endpoints).map(async ([key, path]) => [key, await fetchJson(path, _token)] as const)
    );

    const nextData: AdminData = { ...emptyData };
    const failures: string[] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        const [key, json] = result.value;
        if (key === "dashboard") nextData.dashboard = json.data ?? json;
        else if (key === "rates") nextData.rates = (json.data ?? json ?? []) as RateItem[];
        else nextData[key as keyof AdminData] = unwrapArray(json) as never;
      } else {
        failures.push(result.reason instanceof Error ? result.reason.message : "Request failed");
      }
    }

    setData(nextData);
    setConnection(failures.length ? `Connected with ${failures.length} endpoint issue(s).` : "");
    setLoading(false);
  }, [auth.token]);

  // Load data immediately upon successful auth
  useEffect(() => {
    if (auth.isAuthenticated && auth.token) {
      void loadAdminData(auth.token);
    }
  }, [auth.isAuthenticated, auth.token, loadAdminData]);

  /* ─── Render Engine ─── */
  if (!auth.isAuthenticated) {
    return <Login {...auth} />;
  }

  return (
    <main className={styles.shell}>
      <Sidebar 
        adminName={auth.adminName}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={auth.handleLogout}
      />

      <section className={styles.workspace}>
        <Topbar 
          activeSection={activeSection}
          loading={loading}
          loadAdminData={loadAdminData}
          token={auth.token}
        />

        {loading && <div className={styles.loadingBar} />}

        {connection && (
          <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "0 2px" }}>
            {connection}
          </div>
        )}

        {/* Feature Switches */}
        {activeSection === "dashboard" && <Dashboard data={data} />}
        
        {activeSection === "users" && (
          <UsersTable 
            users={data.users} 
            loading={loading} 
            userSearch={userSearch} setUserSearch={setUserSearch}
            userRoleFilter={userRoleFilter} setUserRoleFilter={setUserRoleFilter}
            loadAdminData={loadAdminData} token={auth.token}
          />
        )}
        
        {activeSection === "orders" && (
          <OrdersTable 
            orders={data.orders} loading={loading}
            orderStatusFilter={orderStatusFilter} setOrderStatusFilter={setOrderStatusFilter}
            loadAdminData={loadAdminData} token={auth.token}
          />
        )}

        {activeSection === "payments" && (
          <PaymentsTable 
            payments={data.payments} loading={loading}
            paymentStatusFilter={paymentStatusFilter} setPaymentStatusFilter={setPaymentStatusFilter}
            loadAdminData={loadAdminData} token={auth.token}
          />
        )}

        {activeSection === "marketplace" && (
          <ListingsTable 
            listings={data.listings} loading={loading}
            listingStatusFilter={listingStatusFilter} setListingStatusFilter={setListingStatusFilter}
            loadAdminData={loadAdminData} token={auth.token}
          />
        )}

        {activeSection === "logs" && (
          <LogsTable 
            logs={data.logs} loading={loading}
            logActionFilter={logActionFilter} setLogActionFilter={setLogActionFilter}
            loadAdminData={loadAdminData} token={auth.token}
          />
        )}

        {activeSection === "complaints" && (
          <ComplaintsTable 
            complaints={data.complaints} loading={loading}
            complaintStatusFilter={complaintStatusFilter} setComplaintStatusFilter={setComplaintStatusFilter}
            loadAdminData={loadAdminData} token={auth.token}
          />
        )}

        {activeSection === "rates" && (
          <RatesManager 
            rates={data.rates} loading={loading}
            loadAdminData={loadAdminData} token={auth.token}
          />
        )}

        {activeSection === "observability" && (
          <Observability token={auth.token} />
        )}
      </section>
    </main>
  );
}
