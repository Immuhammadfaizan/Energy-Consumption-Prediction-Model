// ════════════════════════════════════════════════════════════════
//  MAIN.JS  —  Shared UI wiring for all non-admin pages
//  Handles: auth UI, profile popup, home dashboard, admin nav link
// ════════════════════════════════════════════════════════════════

"use strict";

window.addEventListener("DOMContentLoaded", () => {
  loadHomeDashboard();
});

// ── Home Dashboard ────────────────────────────────────────────
async function loadHomeDashboard() {
  const user = window.currentUser || JSON.parse(localStorage.getItem("currentUser"));

  // Hero stat chips — visible to everyone
  await loadHeroStats();

  if (!user) return;

  // Un-hide the user dashboard section if logged in
  const dashboard = document.getElementById("userDashboard");
  if (dashboard) dashboard.style.display = "block";

  // KPI cards
  await loadDashboardKPIs();
}

async function loadHeroStats() {
  try {
    const res  = await fetch("/api/users/count");
    const data = await res.json();
    if (data.success) {
      const el = document.getElementById("heroUserCount");
      if (el) el.textContent = data.count ?? "—";
    }
  } catch (_) {}

  try {
    const res  = await fetch("/api/predictions/count");
    const data = await res.json();
    if (data.success) {
      const el = document.getElementById("heroPredCount");
      if (el) el.textContent = data.count ?? "—";
    }
  } catch (_) {}
}

async function loadDashboardKPIs() {
  try {
    const res  = await fetch("/api/predictions");
    const data = await res.json();

    if (!data.success) return;

    const preds = data.predictions || [];
    const total = preds.length;

    // KPI cards
    setText("dashTotalPreds", total > 0 ? total : "0");

    if (preds.length > 0) {
      const latest = preds[0];
      const weekVal  = (latest.week_val  || 0);
      const monthVal = (latest.month_val || 0);

      // Growth vs previous period
      const growthPct = weekVal > 0
        ? (((monthVal / 4) - weekVal) / weekVal * 100).toFixed(1)
        : 0;
      const growthSign = growthPct >= 0 ? "+" : "";

      setText("dashLatestForecast", weekVal.toFixed(1) + " kWh");
      setText("dashMonthForecast",  monthVal.toFixed(1) + " kWh");
      setText("dashGrowth",         growthSign + growthPct + "%");
      setText("dashForecastPeriod", "Week · " + (latest.company_name || "latest run"));
    }

    // Recent predictions table
    renderRecentPreds(preds.slice(0, 5));
    
    // Category Breakdown (home dashboard)
    renderHomeBreakdown(preds);

  } catch (err) {
    console.error("Dashboard load error:", err);
  }
}

function renderRecentPreds(preds) {
  const tbody = document.getElementById("recentPredBody");
  if (!tbody) return;

  if (!preds || preds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">
      No predictions yet — <a href="/prediction" style="color:var(--electric)">run one now</a>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = preds.map((p) => {
    const d = p.created_at ? new Date(p.created_at).toLocaleString("en-PK", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    }) : "—";
    return `
      <tr>
        <td style="font-weight:600;color:var(--text)">${p.company_name || "—"}</td>
        <td style="color:var(--electric)">${(p.week_val  || 0).toLocaleString(undefined,{maximumFractionDigits:1})}</td>
        <td style="color:var(--electric)">${(p.month_val || 0).toLocaleString(undefined,{maximumFractionDigits:1})}</td>
        <td style="color:var(--electric)">${(p.year_val  || 0).toLocaleString(undefined,{maximumFractionDigits:1})}</td>
        <td style="color:var(--text-muted);font-size:0.82em">${d}</td>
      </tr>`;
  }).join("");
}

function renderHomeBreakdown(preds) {
  const container = document.getElementById("homeCategoryBreakdown");
  if (!container) return;

  if (preds.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85em; text-align:center;">No data to analyze.</p>`;
    return;
  }

  const counts = {};
  preds.forEach(p => {
    const cat = (p.category || "other").toLowerCase();
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const total = preds.length;
  const categories = [
    { id: "residential", label: "Residential", color: "#0ea5e9" },
    { id: "industrial", label: "Industrial", color: "#64748b" },
    { id: "agricultural", label: "Agricultural", color: "#f59e0b" },
    { id: "commercial", label: "Commercial", color: "#f97316" },
    { id: "street_lighting", label: "Street Lighting", color: "#06b6d4" },
    { id: "other", label: "Other", color: "#22c55e" }
  ];

  container.innerHTML = categories.map(cat => {
    const count = counts[cat.id] || 0;
    const pct = Math.round((count / total) * 100);
    return `
      <div class="breakdown-item">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.82em;">
          <span style="color:var(--text-primary); font-weight:600;">${cat.label}</span>
          <span style="color:var(--text-muted);">${pct}%</span>
        </div>
        <div style="height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:${cat.color}; border-radius:10px;"></div>
        </div>
      </div>
    `;
  }).join("");
}

// ── Utility ───────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
