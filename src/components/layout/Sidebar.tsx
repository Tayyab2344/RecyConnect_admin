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
        <span className={styles.brandMark}>RC</span>
        <div>
          <strong>RecyConnect</strong>
          <span>Admin Panel</span>
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
