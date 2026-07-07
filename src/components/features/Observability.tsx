import React, { useState, useEffect, useRef } from "react";
import styles from "@/app/page.module.css";
import { fetchJson, postJson } from "@/lib/api";
import { formatDate, readNumber } from "@/lib/utils";
import { Icons } from "../common/Icons";

export type ObservabilityProps = {
  token: string;
};

type TelemetryData = {
  telemetry: {
    system: {
      uptimeSeconds: number;
      memoryRssMb: number;
      memoryHeapUsedMb: number;
      cpuUsagePercent: number;
      avgResponseTimeMs: number;
      redisCacheHitRatePercent: number;
      websocketLatencyMs: number;
    };
    database: {
      totalLogs: number;
      errorLogs: number;
      apiLogs: number;
      slowApiLogs: number;
    };
    counts: {
      totalOrders: number;
      totalUsers: number;
    };
  };
  predictions: Array<{
    target: string;
    prediction: string;
    cause: string;
    probability: number;
    recommendedAction: string;
  }>;
  sustainability: {
    totalWeightKg: number;
    totalCo2SavingsKg: number;
    landfillVolReductionM3: number;
    energySavedKwh: number;
    treeEquivalentsYearly: number;
  };
  fraudRisk: Array<{
    userId: number;
    name: string;
    email: string;
    role: string;
    trustScore: number;
    fraudProbability: number;
    deliveryReliability: number;
    paymentStability: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    reasons: string[];
  }>;
};

type AiLog = {
  id: number;
  level: string;
  type: string;
  message: string;
  metadata: Record<string, any>;
  createdAt: string;
};

type ChatMessage = {
  sender: "user" | "copilot";
  text: string;
  chart?: {
    type: "bar" | "line" | "pie";
    labels: string[];
    data: number[];
  };
};

export default function Observability({ token }: ObservabilityProps) {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [aiLogs, setAiLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [healingLogs, setHealingLogs] = useState<Array<{ action: string; time: string; status: string }>>([]);
  const [healingActive, setHealingActive] = useState<string | null>(null);

  // Chat/NLP States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: "copilot",
      text: "👋 Hello! I am the RecyConnect Observability Intelligence Copilot. Ask me about system latencies, fraud risks, database errors, or sustainability metrics, and I will generate conversational explanations and charts.",
    },
  ]);
  const [queryInput, setQueryInput] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadTelemetry = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const telemetryRes = await fetchJson("/admin/observability/telemetry", token);
      const logsRes = await fetchJson("/admin/observability/logs", token);

      setData(telemetryRes.data || telemetryRes);
      setAiLogs(logsRes.data || logsRes || []);
    } catch (err) {
      console.error("Failed to load telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTelemetry();
  }, [token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, queryLoading]);

  // Execute AIOps Self-Healing Action
  const runSelfHealing = async (actionName: string, target: string) => {
    setHealingActive(actionName);
    try {
      await postJson("/admin/observability/heal", token, {
        actionName,
        details: { target, triggeredBy: "admin_observability_portal" },
      });

      setHealingLogs((prev) => [
        { action: actionName, time: new Date().toLocaleTimeString(), status: "SUCCESS" },
        ...prev,
      ]);

      // Reload telemetry
      void loadTelemetry();
    } catch (err) {
      console.error("Healing execution failed:", err);
    } finally {
      setHealingActive(null);
    }
  };

  // Submit NLP Query to Gemini
  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || queryLoading) return;

    const userText = queryInput;
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setQueryInput("");
    setQueryLoading(true);

    try {
      const res = await postJson("/admin/observability/query", token, { message: userText });
      const rawAnswer = res.data?.answer || res.answer || "No response generated.";

      // Parse chart config from response: [CHART_CONFIG]: {"type":"line", ...}
      let cleanedText = rawAnswer;
      let chartConfig = undefined;

      const chartIndex = rawAnswer.indexOf("[CHART_CONFIG]:");
      if (chartIndex !== -1) {
        cleanedText = rawAnswer.substring(0, chartIndex).trim();
        const jsonStr = rawAnswer.substring(chartIndex + 15).trim();
        try {
          chartConfig = JSON.parse(jsonStr);
        } catch {
          console.warn("Failed to parse chart config JSON");
        }
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: "copilot", text: cleanedText, chart: chartConfig },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "copilot", text: `Error: ${err.message || "Failed to reach intelligence backend."}` },
      ]);
    } finally {
      setQueryLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className={styles.emptyState} style={{ minHeight: "400px" }}>
        <div className={styles.loadingBar} />
        <p>Loading AI Observability metrics and telemetry data...</p>
      </div>
    );
  }

  const sys = data?.telemetry?.system;
  const db = data?.telemetry?.database;
  const sustain = data?.sustainability;
  const fraud = data?.fraudRisk || [];
  const preds = data?.predictions || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "12px 0 32px 0" }}>
      {/* 1. Header & Live Indicator */}
      <section className={styles.hero} style={{ marginBottom: 0 }}>
        <p className={styles.eyebrow}>RecyConnect AI Observability Engine</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Autonomous Operations & Performance Telemetry</h2>
          <button 
            className={styles.btn} 
            onClick={() => void loadTelemetry()} 
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Icons.Refresh size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "Refreshing..." : "Refresh Metrics"}
          </button>
        </div>
      </section>

      {/* 2. System Performance Grid (High Fidelity Metrics Gauges) */}
      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span>CPU load</span>
          <strong style={{ color: (sys?.cpuUsagePercent ?? 0) > 75 ? "var(--danger)" : "inherit" }}>
            {sys?.cpuUsagePercent ?? 0}%
          </strong>
          <div style={{ width: "100%", background: "var(--border)", height: "4px", borderRadius: "2px", overflow: "hidden", marginTop: "8px" }}>
            <div style={{ width: `${sys?.cpuUsagePercent ?? 0}%`, background: (sys?.cpuUsagePercent ?? 0) > 75 ? "var(--danger)" : "var(--primary)", height: "100%" }} />
          </div>
          <p>Core scheduling saturation</p>
        </article>

        <article className={styles.statCard}>
          <span>RAM Allocation</span>
          <strong>{sys?.memoryRssMb ?? 0} MB</strong>
          <p>Uptime: {Math.round((sys?.uptimeSeconds ?? 0) / 3600)} hrs</p>
        </article>

        <article className={styles.statCard}>
          <span>Avg API Latency</span>
          <strong style={{ color: (sys?.avgResponseTimeMs ?? 0) > 200 ? "var(--warning)" : "inherit" }}>
            {sys?.avgResponseTimeMs ?? 0} ms
          </strong>
          <p>WS Session Latency: {sys?.websocketLatencyMs ?? 0}ms</p>
        </article>

        <article className={styles.statCard}>
          <span>Redis Cache Hit</span>
          <strong>{sys?.redisCacheHitRatePercent ?? 0}%</strong>
          <p>Autocompletes & listings queries</p>
        </article>
      </section>

      {/* 3. Observability Core Panels */}
      <div className={styles.contentGrid}>
        {/* Anomaly Alerts & Failure Predictions (AIOps Self-Healing Hub) */}
        <article className={styles.panel} style={{ flex: 1.2 }}>
          <div className={styles.panelHeader} style={{ padding: 0, border: "none", marginBottom: "16px" }}>
            <div>
              <p className={styles.eyebrow}>AIOps & Failure Mitigation</p>
              <h3>Predictive Anomaly Log</h3>
            </div>
            <span className={styles.badgeDanger}>{preds.length} Predicted</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {preds.map((pred, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "16px",
                  background: "rgba(240, 180, 41, 0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "var(--warning)" }}>⚠️ Anomaly in {pred.target}</strong>
                  <span className={styles.badge} style={{ color: "var(--warning)" }}>
                    Confidence: {Math.round(pred.probability * 100)}%
                  </span>
                </div>
                <p style={{ margin: "8px 0", fontSize: "13px" }}>{pred.prediction}</p>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
                  <strong>Root Cause:</strong> {pred.cause}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text)" }}>
                    💡 Fix: {pred.recommendedAction.substring(0, 45)}...
                  </span>
                  <button
                    className={styles.btn}
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                    onClick={() => void runSelfHealing(`HEAL_${pred.target.toUpperCase().replace(/ /g, "_")}`, pred.target)}
                    disabled={healingActive !== null}
                  >
                    {healingActive === `HEAL_${pred.target.toUpperCase().replace(/ /g, "_")}` ? "Healing..." : "⚡ Trigger Heal"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {healingLogs.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h5 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>AIOps Healed Logs</h5>
              <div style={{ maxHeight: "100px", overflowY: "auto", fontSize: "12px", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px", marginTop: "6px" }}>
                {healingLogs.map((log, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span style={{ color: "var(--success)" }}>✅ {log.action}</span>
                    <span style={{ color: "var(--text-dim)" }}>{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Sustainability Dashboard */}
        <article className={styles.panel}>
          <div className={styles.panelHeader} style={{ padding: 0, border: "none", marginBottom: "16px" }}>
            <div>
              <p className={styles.eyebrow}>Sustainability Footprint</p>
              <h3>Platform Climate Impact</h3>
            </div>
            <span className={styles.badge} style={{ background: "rgba(48, 217, 139, 0.2)", color: "#30d98b" }}>Active</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--card-hover)", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Platform CO₂ Offset Savings</span>
              <h2 style={{ color: "#30d98b", fontSize: "28px", margin: "4px 0" }}>
                {sustain?.totalCo2SavingsKg.toLocaleString() ?? 0} kg
              </h2>
              <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                Equivalent to <strong>{sustain?.treeEquivalentsYearly ?? 0}</strong> mature trees absorbing carbon for a year
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ border: "1px solid var(--border)", padding: "12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total Waste Diverted</span>
                <strong style={{ display: "block", fontSize: "15px", marginTop: "4px" }}>
                  {sustain?.totalWeightKg.toLocaleString() ?? 0} kg
                </strong>
              </div>
              <div style={{ border: "1px solid var(--border)", padding: "12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Landfill Volume Diverted</span>
                <strong style={{ display: "block", fontSize: "15px", marginTop: "4px" }}>
                  {sustain?.landfillVolReductionM3.toLocaleString() ?? 0} m³
                </strong>
              </div>
            </div>

            <div style={{ border: "1px solid var(--border)", padding: "12px", borderRadius: "8px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Estimated Industrial Energy Saved</span>
              <strong style={{ display: "block", fontSize: "15px", color: "var(--primary-light)", marginTop: "4px" }}>
                {sustain?.energySavedKwh.toLocaleString() ?? 0} kWh
              </strong>
            </div>
          </div>
        </article>
      </div>

      {/* 4. Users Trust Score & Fraud risk index */}
      <section className={styles.tablePanel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>AI Identity Auditing</p>
            <h3>Fraud Risk Index & Trust Score</h3>
          </div>
          <span className={styles.badge} style={{ background: "rgba(248, 81, 73, 0.1)", color: "var(--danger)" }}>
            Real-time biometric profiling
          </span>
        </div>

        <div className={styles.tableWrap}>
          <div className={`${styles.tableHead}`} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr 0.8fr 1.5fr", gap: "12px", padding: "12px 16px" }}>
            <span>User</span>
            <span>Role</span>
            <span>Trust Score</span>
            <span>Fraud Probability</span>
            <span>Risk Level</span>
            <span>Audit Details</span>
          </div>

          {fraud.length === 0 ? (
            <div className={styles.emptyState}>No audited users.</div>
          ) : (
            fraud.map((u) => (
              <div
                key={u.userId}
                className={styles.tableRow}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr 0.8fr 1.5fr",
                  gap: "12px",
                  padding: "12px 16px",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{u.name}</strong>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{u.email}</div>
                </div>
                <span className={styles.badge}>{u.role.toUpperCase()}</span>
                <div>
                  <strong style={{ color: u.trustScore > 80 ? "#30d98b" : u.trustScore > 50 ? "var(--warning)" : "var(--danger)" }}>
                    {u.trustScore} / 100
                  </strong>
                </div>
                <div>{Math.round(u.fraudProbability * 100)}%</div>
                <div>
                  <span
                    className={
                      u.riskLevel === "HIGH"
                        ? styles.badgeDanger
                        : u.riskLevel === "MEDIUM"
                        ? styles.badgePurple
                        : styles.badge
                    }
                  >
                    {u.riskLevel}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {u.reasons.join(", ")}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 5. Natural Language Observability Analytics (AI Copilot Chat Console) */}
      <article className={styles.panel} style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className={styles.panelHeader} style={{ padding: 0, border: "none", marginBottom: "16px" }}>
          <div>
            <p className={styles.eyebrow}>AI Intelligence Copilot</p>
            <h3>Natural Language Analytics Engine</h3>
          </div>
          <span className={styles.badge}>Gemini 3.5 Active</span>
        </div>

        {/* Chat Output Console */}
        <div
          style={{
            height: "320px",
            overflowY: "auto",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "16px",
            background: "rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                background: msg.sender === "user" ? "var(--primary)" : "var(--border)",
                color: msg.sender === "user" ? "white" : "var(--text)",
                borderRadius: "12px",
                padding: "10px 14px",
                maxWidth: "80%",
                fontSize: "13px",
              }}
            >
              <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
              
              {/* Dynamic Chart Rendering (Visual Analytics Integration) */}
              {msg.chart && (
                <div style={{ marginTop: "16px", background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                    📊 Generated {msg.chart.type} Chart
                  </span>
                  
                  {/* SVG Bar Chart rendering */}
                  {msg.chart.type === "bar" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {msg.chart.labels.map((lbl, idx) => {
                        const val = msg.chart!.data[idx];
                        const max = Math.max(...msg.chart!.data, 1);
                        const percent = Math.round((val / max) * 100);
                        return (
                          <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 0.5fr", gap: "8px", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{lbl}</span>
                            <div style={{ background: "rgba(255,255,255,0.1)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                              <div style={{ width: `${percent}%`, background: "var(--primary-light)", height: "100%" }} />
                            </div>
                            <span style={{ fontSize: "11px", fontWeight: "bold" }}>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SVG Line Chart mock or Pie segments */}
                  {(msg.chart.type === "line" || msg.chart.type === "pie") && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-around", padding: "8px 0" }}>
                      {msg.chart.labels.map((lbl, idx) => (
                        <div key={idx} style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>{lbl}</span>
                          <strong style={{ fontSize: "14px", color: "var(--success)" }}>{msg.chart!.data[idx]}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {queryLoading && (
            <div style={{ alignSelf: "flex-start", background: "var(--border)", padding: "10px 14px", borderRadius: "12px", fontSize: "13px" }}>
              <span>Thinking...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Console Input Bar */}
        <form onSubmit={handleSendQuery} style={{ display: "flex", gap: "10px" }}>
          <input
            className={styles.searchInput}
            style={{ flex: 1, padding: "12px" }}
            placeholder="Ask Copilot e.g., 'What is our carbon offset?' or 'Are there any high risk users?'..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            disabled={queryLoading}
          />
          <button className={styles.btn} type="submit" style={{ padding: "0 24px" }} disabled={queryLoading}>
            Send
          </button>
        </form>

        {/* Shortcuts */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
          {["Show platform carbon footprint", "List high risk fraud warnings", "Telemetry health report"].map((shortcut) => (
            <button
              key={shortcut}
              onClick={() => setQueryInput(shortcut)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "4px 12px",
                fontSize: "11px",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              💡 {shortcut}
            </button>
          ))}
        </div>
      </article>

      {/* 6. AI Log Stream */}
      <section className={styles.tablePanel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>AI-Native Structured Logs</p>
            <h3>Live Observability Log Stream</h3>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <div className={`${styles.tableHead}`} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.5fr 1fr", gap: "12px", padding: "12px 16px" }}>
            <span>Timestamp</span>
            <span>AI Event</span>
            <span>Message / Details</span>
            <span>Context ID</span>
          </div>

          {aiLogs.length === 0 ? (
            <div className={styles.emptyState}>No AI logs captured yet. Perform platform actions to generate logs.</div>
          ) : (
            aiLogs.map((log) => (
              <div
                key={log.id}
                className={styles.tableRow}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1.5fr 1fr",
                  gap: "12px",
                  padding: "12px 16px",
                  alignItems: "center",
                  fontSize: "12px",
                }}
              >
                <span>{formatDate(log.createdAt)}</span>
                <span className={styles.badgePurple}>{log.metadata?.event || "AI_EVENT"}</span>
                <div>
                  <div style={{ fontWeight: "bold" }}>{log.message}</div>
                  <pre style={{ fontSize: "10px", margin: "4px 0 0 0", color: "var(--text-dim)", overflowX: "auto" }}>
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
                <span style={{ fontFamily: "monospace", fontSize: "10px", color: "var(--text-muted)" }}>
                  {log.metadata?.traceId ? `trace-${log.metadata.traceId.substring(0, 8)}` : "—"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
