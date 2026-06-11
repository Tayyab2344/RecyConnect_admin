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
        <div className={styles.brandMark} style={{ background: "rgba(48, 217, 139, 0.08)", border: "1.5px solid var(--accent)", width: "38px", height: "38px", minWidth: "38px", display: "grid", placeItems: "center", borderRadius: "10px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 1L21 5L17 9" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 11V9C3 5.68629 5.68629 3 9 3H21" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 23L3 19L7 15" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 13V15C21 18.3137 18.3137 21 15 21H3" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
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
