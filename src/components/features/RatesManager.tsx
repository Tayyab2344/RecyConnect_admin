import React, { useState } from "react";
import styles from "@/app/page.module.css";
import { RateItem } from "@/types/admin";
import { formatDate } from "@/lib/utils";
import { postJson, deleteJson } from "@/lib/api";
import { Icons } from "../common/Icons";

export type RatesManagerProps = {
  rates: RateItem[];
  loading: boolean;
  loadAdminData: () => Promise<void>;
  token: string;
};

export default function RatesManager({
  rates,
  loading,
  loadAdminData,
  token
}: RatesManagerProps) {
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateForm, setRateForm] = useState({ category: "", pricePerUnit: "", unit: "kg" });
  const [rateLoading, setRateLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddOrEditRate = async () => {
    if (!rateForm.category || !rateForm.pricePerUnit) return;
    setRateLoading(true);
    try {
      await postJson("/admin/rates", token, {
        category: rateForm.category,
        pricePerUnit: parseFloat(rateForm.pricePerUnit),
        unit: rateForm.unit,
      });
      setShowRateModal(false);
      setRateForm({ category: "", pricePerUnit: "", unit: "kg" });
      setIsEditing(false);
      await loadAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save rate");
    }
    setRateLoading(false);
  };

  const handleEditClick = (rate: RateItem) => {
    setRateForm({
      category: rate.category,
      pricePerUnit: rate.pricePerUnit.toString(),
      unit: rate.unit,
    });
    setIsEditing(true);
    setShowRateModal(true);
  };

  const handleDeleteRate = async (category: string) => {
    if (!confirm(`Are you sure you want to delete the rate for ${category}?`)) return;
    setRateLoading(true);
    try {
      await deleteJson(`/admin/rates/${category}`, token);
      await loadAdminData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete rate");
    }
    setRateLoading(false);
  };

  return (
    <>
      <section className={styles.tablePanel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelHeaderInner}>
            <p className={styles.eyebrow}>Category & Rate Management</p>
            <h3>Rate List ({rates.length} categories)</h3>
          </div>
          <div className={styles.panelActions}>
            <button className={styles.btn} onClick={() => void loadAdminData()} disabled={!token || loading}>Refresh</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setIsEditing(false); setRateForm({ category: "", pricePerUnit: "", unit: "kg" }); setShowRateModal(true); }}>+ Add Category</button>
          </div>
        </div>
        {loading && <div className={styles.loadingBar} />}
        <div className={styles.tableWrap}>
          <div className={`${styles.tableHead} ${styles.rateGrid}`}>
            <span>Category</span><span>Rate (PKR)</span><span>Unit</span><span>Updated</span><span>Actions</span>
          </div>
          {rates.length === 0 ? (
            <div className={styles.emptyState}>
              <Icons.Rates size={36} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
              <strong>No categories yet</strong>
              <p>Click &apos;+ Add Category&apos; to create your first rate.</p>
            </div>
          ) : (
            rates.map((rate) => (
              <div className={`${styles.tableRow} ${styles.rateGrid}`} key={rate.category}>
                <strong>{rate.category}</strong>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>PKR {rate.pricePerUnit}</span>
                <span>per {rate.unit}</span>
                <span>{formatDate(rate.updatedAt)}</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className={`${styles.btn} ${styles.btnSmall}`} onClick={() => handleEditClick(rate)}>Edit</button>
                  <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`} onClick={() => handleDeleteRate(rate.category)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {showRateModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowRateModal(false); setIsEditing(false); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{isEditing ? "Edit Category Rate" : "Add New Category Rate"}</h3>
            <div className={styles.formGroup}>
              <label>Category Name</label>
              <input 
                placeholder="e.g. Plastic, Metal, Paper, E-waste" 
                value={rateForm.category} 
                onChange={(e) => setRateForm({ ...rateForm, category: e.target.value })}
                disabled={isEditing}
                style={isEditing ? { backgroundColor: "var(--bg-elevated)", cursor: "not-allowed" } : {}}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Price Per Unit (PKR)</label>
              <input 
                type="number" 
                placeholder="e.g. 120" 
                value={rateForm.pricePerUnit} 
                onChange={(e) => setRateForm({ ...rateForm, pricePerUnit: e.target.value })} 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Unit</label>
              <select value={rateForm.unit} onChange={(e) => setRateForm({ ...rateForm, unit: e.target.value })}>
                <option value="kg">kg</option>
                <option value="unit">unit</option>
                <option value="ton">ton</option>
                <option value="piece">piece</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btn} onClick={() => { setShowRateModal(false); setIsEditing(false); }}>Cancel</button>
              <button 
                className={`${styles.btn} ${styles.btnPrimary}`} 
                onClick={handleAddOrEditRate} 
                disabled={rateLoading || !rateForm.category || !rateForm.pricePerUnit}
              >
                {rateLoading ? "Saving..." : (isEditing ? "Save Changes" : "Add Category")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
