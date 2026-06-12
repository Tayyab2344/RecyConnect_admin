import React from "react";
import styles from "@/app/page.module.css";
import { Section, navItems } from "@/types/admin";

export type SidebarProps = {
  adminName: string;
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  handleLogout: () => void;
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
        {navItems.map((item) => (
          <button
            className={`${styles.navItem} ${activeSection === item.section ? styles.navItemActive : ""}`}
            key={item.section}
            onClick={() => setActiveSection(item.section)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <span>Signed in as <strong style={{ display: "inline", color: "var(--text)" }}>{adminName}</strong></span>
        <button className={styles.logoutBtn} onClick={handleLogout}>🚪 Sign Out</button>
      </div>
    </aside>
  );
}
