import React from "react";
import styles from "@/app/page.module.css";
import { Section, navItems } from "@/types/admin";

export type TopbarProps = {
  activeSection: Section;
  loading: boolean;
  loadAdminData: (token: string) => Promise<void>;
  token: string;
};

export default function Topbar({ activeSection, loading, loadAdminData, token }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <div>
        <p className={styles.eyebrow}>{navItems.find((n) => n.section === activeSection)?.label ?? "Dashboard"}</p>
        <h1>RecyConnect Admin</h1>
      </div>
      <div className={styles.topbarActions}>
        <button className={styles.btn} onClick={() => void loadAdminData(token)} disabled={loading}>
          {loading ? "Loading..." : "↻ Refresh Data"}
        </button>
      </div>
    </header>
  );
}
