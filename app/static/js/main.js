// ════════════════════════════════════════════════════════════════
//  MAIN.JS  —  Shared UI wiring for all non-admin pages
//  Handles: auth UI, profile popup, home dashboard, admin nav link
// ════════════════════════════════════════════════════════════════

"use strict";

window.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  setupProfilePopup();
  setupLogoutButtons();
  loadHomeDashboard();
});

// ── Auth UI ───────────────────────────────────────────────────
function updateAuthUI() {
  const user = window.currentUser;

  const userEmailBtn = document.getElementById("userEmail");
  const firstName    = document.getElementById("userFirstName");
  const authBtn      = document.getElementById("authBtn");
  const logoutHeader = document.getElementById("logoutBtnHeader");
  const logoutSide   = document.getElementById("logoutBtn");
  const dashboard    = document.getElementById("userDashboard");

  // Admin nav items (both desktop and mobile)
  const adminNavItem  = document.getElementById("adminNavItem");
  const adminSideItem = document.getElementById("adminSidebarItem");

  if (user) {
    const name = user.fullname
      ? user.fullname.split(" ")[0]
      : user.email.split("@")[0];

    // Profile trigger button
    if (userEmailBtn) {
      userEmailBtn.style.display = "flex";
    }
    if (firstName) firstName.textContent = name;

    // Auth buttons
    if (authBtn)      authBtn.style.display      = "none";
    if (logoutHeader) logoutHeader.style.display  = "inline-flex";
    if (logoutSide)   logoutSide.style.display    = "block";

    // Dashboard section (home page only)
    if (dashboard) dashboard.style.display = "block";

    // Admin nav links
    const isAdmin = user.is_admin === 1 || user.is_admin === true;
    if (isAdmin) {
      if (adminNavItem)  adminNavItem.style.display  = "block";
      if (adminSideItem) adminSideItem.style.display = "block";
    }

    // Profile popup fields
    const pName = document.getElementById("profileName");
    const pEmail= document.getElementById("profileEmail");
    const pOrg  = document.getElementById("profileOrg");
    const pCity = document.getElementById("profileCity");
    const pRole = document.getElementById("profileRole");
    if (pName)  pName.textContent  = user.fullname || "User";
    if (pEmail) pEmail.textContent = user.email    || "—";
    if (pOrg)   pOrg.textContent   = user.organization || "—";
    if (pCity)  pCity.textContent  = user.city     || "—";
    if (pRole)  pRole.textContent  = isAdmin ? "Administrator" : "User";

  } else {
    if (userEmailBtn) userEmailBtn.style.display = "none";
    if (authBtn)      authBtn.style.display = "inline-flex";
    if (logoutHeader) logoutHeader.style.display = "none";
    if (logoutSide)   logoutSide.style.display   = "none";
    if (dashboard)    dashboard.style.display     = "none";
  }
}

// ── Profile Popup ─────────────────────────────────────────────
function setupProfilePopup() {
  const trigger  = document.getElementById("userEmail");
  const popup    = document.getElementById("profilePopup");
  const closeBtn = document.querySelector(".close-popup");
  const logoutPop= document.getElementById("profileLogoutBtn");

  if (!popup) return;

  if (trigger) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const showing = popup.style.display !== "none";
      popup.style.display = showing ? "none" : "block";
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      popup.style.display = "none";
    });
  }

  document.addEventListener("click", (e) => {
    if (popup && !popup.contains(e.target) && e.target !== trigger && !trigger?.contains(e.target)) {
      popup.style.display = "none";
    }
  });

  if (logoutPop) logoutPop.addEventListener("click", doLogout);
}

// ── Logout ────────────────────────────────────────────────────
function setupLogoutButtons() {
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    doLogout();
  });
  document.getElementById("logoutBtnHeader")?.addEventListener("click", (e) => {
    e.preventDefault();
    doLogout();
  });
}

function doLogout() {
  window.location.href = "/auth/logout";
}

// ── Home Dashboard ────────────────────────────────────────────
async function loadHomeDashboard() {
  const user = window.currentUser;

  // Hero stat chips — visible to everyone
  await loadHeroStats();

  if (!user) return;

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

// ── Utility ───────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
