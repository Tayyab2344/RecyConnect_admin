import React from "react";
import styles from "@/app/page.module.css";
import { Section, navItems } from "@/types/admin";

export type SidebarProps = {
  adminName: string;
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  handleLogout: () => void;
};

import { Icons } from "../common/Icons";

const IconMap: Record<Section, React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>> = {
  dashboard: Icons.Dashboard,
  users: Icons.Users,
  orders: Icons.Orders,
  payments: Icons.Payments,
  marketplace: Icons.Marketplace,
  rates: Icons.Rates,
  complaints: Icons.Complaints,
  security: Icons.Security,
  logs: Icons.Logs,
  observability: Icons.Observability,
};

export default function Sidebar({
  adminName,
  activeSection,
  setActiveSection,
  handleLogout,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img 
          src="/app_ico.png" 
          alt="RecyConnect Logo" 
          style={{ 
            width: "36px", 
            height: "36px", 
            borderRadius: "10px", 
            objectFit: "contain",
            boxShadow: "0 4px 12px -2px rgba(48, 217, 139, 0.3)" 
          }} 
        />
        <div>
          <strong style={{ letterSpacing: "-0.3px", fontSize: "16px" }}>Recy<span style={{ color: "var(--accent)" }}>Connect</span></strong>
          <span style={{ fontSize: "9.5px", letterSpacing: "1.5px" }}>COMMAND CENTER</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const IconComp = IconMap[item.section];
          return (
            <button
              className={`${styles.navItem} ${activeSection === item.section ? styles.navItemActive : ""}`}
              key={item.section}
              onClick={() => setActiveSection(item.section)}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <span className={styles.navIcon} style={{ display: "inline-flex", alignItems: "center" }}>
                {IconComp ? <IconComp size={18} /> : null}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <span>Signed in as <strong style={{ display: "inline", color: "var(--text)" }}>{adminName}</strong></span>
        <button 
          className={styles.logoutBtn} 
          onClick={handleLogout}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center" }}
        >
          <Icons.Logout size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
