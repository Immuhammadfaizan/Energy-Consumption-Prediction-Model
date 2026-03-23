//  ADMIN.JS

"use strict";

// ── State ─
let currentUser = null;
let allUsers = [];
let allPredictions = [];
let selectedUserId = null;

// ── Chart Instances (Standardized naming to avoid ID collisions)
let _categoryChart = null;
let _trendLineChart = null;
let _peakUsageChart = null;
let _hourlyForecastChart = null;
let _rfLiveChartInst = null;
let _rfInterval = null;
let _intelInterval = null;

// ── Intel Modal State
let _intelChartInst = null;
let _activeIntelTab = "cumulative";

// ── Chart.js Defaults
function setChartDefaults() {
  if (typeof Chart === "undefined") return;
  Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = "#64748b";
}

// ── Init
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Admin initialized...");

  // 1. Resolve User from window or localStorage
  currentUser =
    window.currentUser ||
    JSON.parse(localStorage.getItem("currentUser")) ||
    null;

  if (!currentUser) {
    console.warn("No active session found. Redirecting...");
    window.location.href = "/auth/login";
    return;
  }

  try {
    setChartDefaults();
    updateAdminAuthUI();
    setupProfilePopup();
    setupLogoutButtons();
    setupAdminMenuToggle();
    setupAdminTabs();
    setupSettingsToggles();
    displayAdminInfo();
    setupChartSwitcher();

    // 2. Initial Data Load
    await loadData();
    console.log("Core Admin systems online.");
  } catch (err) {
    console.error("Critical Admin Init Failure:", err);
  }
});

// ── Data Loader
async function loadData() {
  try {
    const [uRes, pRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/predictions"),
    ]);

    const uData = await uRes.json();
    const pData = await pRes.json();

    if (uData.success) {
      allUsers = uData.users.map((u) => {
        u.isAdmin = u.is_admin === 1 || u.is_admin === true;
        return u;
      });
    }

    if (pData.success) {
      allPredictions = pData.predictions.map((p) => {
        // p is already flat from Prediction.to_dict()
        return p;
      });
    }

    displayDashboard();
    displayPredictions();
    if (typeof displayUsers === "function") displayUsers();
    updateStorageCard();
  } catch (err) {
    console.error("Admin data load failed:", err);
  }
}

// ── Auth UI
function updateAdminAuthUI() {
  const nameEl = document.getElementById("userFirstName");
  const trigger = document.getElementById("userEmail");
  const logoutEl = document.getElementById("logoutBtnHeader");

  if (!currentUser) return;

  const firstName = currentUser.fullname
    ? currentUser.fullname.split(" ")[0]
    : currentUser.email
      ? currentUser.email.split("@")[0]
      : "Admin";

  if (nameEl) nameEl.textContent = firstName;
  if (trigger) trigger.style.display = "flex";
  if (logoutEl) logoutEl.style.display = "inline-flex";

  // Profile Picture
  const avatarPath = currentUser.profile_pic || "/static/images/default-avatar.png";
  const headerAv = document.getElementById("headerAvatar");
  if (headerAv) headerAv.src = avatarPath;
}

// ── Profile Popup
function setupProfilePopup() {
  const trigger = document.getElementById("userEmail");
  const popup = document.getElementById("profilePopup");
  const close = document.querySelector(".close-popup");
  const logoutBtn = document.getElementById("profileLogoutBtn");

  if (!trigger || !popup) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = popup.style.display === "block";
    if (open) {
      popup.style.display = "none";
      popup.classList.remove("show");
    } else {
      fillProfilePopup();
      popup.style.display = "block";
      popup.classList.add("show");
    }
  });

  close?.addEventListener("click", () => {
    popup.style.display = "none";
    popup.classList.remove("show");
  });

  // Avatar Upload Handling (Admin)
  const uploadInput = document.getElementById("avatarUpload");
  if (uploadInput) {
    uploadInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/profile/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          currentUser.profile_pic = data.profile_pic;
          localStorage.setItem("currentUser", JSON.stringify(currentUser));
          updateAdminAuthUI();
          fillProfilePopup();
          displayAdminInfo();
          showToast("Admin profile photo updated!");
        } else {
          showToast(data.error || "Upload failed", true);
        }
      } catch (err) {
        console.error(err);
        showToast("An error occurred during upload.", true);
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (
      !popup.contains(e.target) &&
      e.target !== trigger &&
      !trigger.contains(e.target)
    ) {
      popup.style.display = "none";
      popup.classList.remove("show");
    }
  });

  logoutBtn?.addEventListener("click", logout);
}

function fillProfilePopup() {
  const cityMap = buildCityMap();
  document.getElementById("profileName").textContent =
    currentUser.fullname || "Admin";
  document.getElementById("profileEmail").textContent =
    currentUser.email || "—";
  document.getElementById("profileOrg").textContent =
    currentUser.organization || "—";
  document.getElementById("profileCity").textContent =
    cityMap[currentUser.city] || currentUser.city || "—";

  // Popup Avatar
  const avatarPath = currentUser.profile_pic || "/static/images/default-avatar.png";
  const popupAv = document.getElementById("popupAvatar");
  if (popupAv) popupAv.src = avatarPath;
}

// ── Admin Tabs ───────────────────────────────────────────────────
function setupAdminTabs() {
  const tabs = document.querySelectorAll(".admin-tab");
  const sections = [
    "dashboardSection",
    "usersSection",
    "predictionsSection",
    "settingsSection",
  ].map((id) => document.getElementById(id));

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      tabs.forEach((t) => t.classList.remove("active"));
      sections.forEach((s) => s && (s.style.display = "none"));
      tab.classList.add("active");

      const targetId = tab.dataset.target;
      const section = document.getElementById(targetId);
      if (section) section.style.display = "block";

      if (targetId === "usersSection") displayUsers();
      if (targetId === "predictionsSection") displayPredictions();
      if (targetId === "dashboardSection") displayDashboard();

      // close mobile sidebar
      if (window.innerWidth <= 1024) {
        const sidebar = document.querySelector(".admin-sidebar");
        const overlay = document.querySelector(".sidebar-overlay");
        const main = document.querySelector(".admin-main");
        sidebar?.classList.remove("active");
        overlay?.classList.remove("active");
        main?.classList.remove("shifted");
        document.body.style.overflow = "auto";
      }
    });
  });
}

// ── Admin Sidebar Toggle ─────────────────────────────────────────
function setupAdminMenuToggle() {
  const btn = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".admin-sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  const main = document.querySelector(".admin-main");

  if (!btn || !sidebar) return;

  btn.addEventListener("click", () => {
    const open = sidebar.classList.contains("active");
    if (open) {
      sidebar.classList.remove("active");
      overlay?.classList.remove("active");
      main?.classList.remove("shifted");
      document.body.style.overflow = "auto";
    } else {
      sidebar.classList.add("active");
      overlay?.classList.add("active");
      main?.classList.add("shifted");
      document.body.style.overflow = "hidden";
    }
  });

  overlay?.addEventListener("click", () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    main?.classList.remove("shifted");
    document.body.style.overflow = "auto";
  });
}

// ── Storage Card ─────────────────────────────────────────────────
function updateStorageCard() {
  const storageEl = document.getElementById("storageUsage");
  if (!storageEl) return;
  // Estimate from prediction count x avg size
  const estMB = ((allPredictions.length * 12) / 1024).toFixed(2);
  storageEl.textContent = estMB + " MB";
  const statusEl = document.getElementById("storageStatus");
  if (statusEl)
    statusEl.textContent = `${allPredictions.length} records stored`;
}

// ── Dashboard ────────────────────────────────────────────────────
function displayDashboard() {
  // Resilience: Allow rendering even if one data source failed
  if (!allPredictions || !Array.isArray(allPredictions)) {
    console.warn("displayDashboard: No predictions loaded yet.");
    return;
  }
  const todayStr = new Date().toLocaleDateString();
  const predictionsTodayCount = allPredictions.filter((p) => {
    const d = p.created_at || p.createdAt;
    return d && new Date(d).toLocaleDateString() === todayStr;
  }).length;

  const totalPredsEl = document.getElementById("totalPredictions");
  const predsTodayEl = document.getElementById("predictionsToday");
  const totalUsersEl = document.getElementById("totalUsers");

  if (totalPredsEl) totalPredsEl.textContent = allPredictions.length;
  if (predsTodayEl) predsTodayEl.textContent = predictionsTodayCount;
  if (totalUsersEl) totalUsersEl.textContent = allUsers.length;

  // Real Active Users: Calculate based on last_login within last 5 minutes
  const now = new Date();
  const activeCount = allUsers.filter((u) => {
    if (!u.last_login) return false;
    const lastSeen = new Date(u.last_login);
    return now - lastSeen < 5 * 60 * 1000;
  }).length;

  const liveEl = document.getElementById("activeUsersVal");
  if (liveEl) {
    liveEl.textContent = Math.max(1, activeCount);
  }

  // 2. Summary row
  updateAnalyticsSummary();

  // 3. Render default chart
  const activeTab = document.querySelector(".admin-chart-tab.active");
  if (activeTab) switchChart(activeTab.dataset.chart);

  // 4. Activity log
  buildActivityLog();
}

// ── Analytics Summary ────────────────────────────────────────────
function updateAnalyticsSummary() {
  const avgEl = document.getElementById("avgDaily");
  const peakEl = document.getElementById("peakUsage");
  const growEl = document.getElementById("accuracy");

  if (!allPredictions || allPredictions.length === 0) {
    if (avgEl) avgEl.textContent = "—";
    if (peakEl) peakEl.textContent = "—";
    if (growEl) growEl.textContent = "—";
    return;
  }

  // Calculate stats based on flat schema
  const avgD = (
    allPredictions.reduce((s, p) => s + (p.week_val || 0), 0) /
    (allPredictions.length * 7 || 1)
  ).toFixed(0);

  const peak = Math.max(...allPredictions.map((p) => p.week_val || 0)).toFixed(
    0,
  );

  const totalG = allPredictions.reduce((s, p) => {
    // Fallback to insights if growth_pct is missing (legacy)
    const g =
      p.growth_pct !== undefined ? p.growth_pct : p.insights?.growth_pct || 0;
    return s + g;
  }, 0);
  const avgG = (totalG / (allPredictions.length || 1)).toFixed(1);

  if (avgEl) avgEl.textContent = avgD + " kWh";
  if (peakEl)
    peakEl.textContent = (allPredictions.length ? peak : "0") + " kWh";
  if (growEl) {
    growEl.textContent = avgG + "%";
    growEl.style.color = avgG >= 0 ? "var(--success)" : "var(--danger)";
  }
}

function buildActivityLog() {
  const container = document.getElementById("activityLog");
  if (!container) return;

  const events = [];
  // User creation events
  allUsers.forEach((u) => {
    if (u.created_at) {
      events.push({
        user: u.fullname || u.email,
        activity: "Account Created",
        timestamp: new Date(u.created_at),
        statusCls: "success",
        statusTxt: "Registered",
      });
    }
  });

  // Prediction events
  allPredictions.forEach((p) => {
    const user = allUsers.find((u) => u.id === (p.user_id || p.userId));
    if (p.created_at || p.createdAt) {
      const cat = (p.category || user?.category || "Other").trim();
      events.push({
        user: p.user_fullname || user?.fullname || "Unknown",
        activity: `Generated Prediction (${p.city || "System"})`,
        category: cat,
        timestamp: new Date(p.created_at || p.createdAt),
        statusCls: "info",
        statusTxt: "Completed",
      });
    }
  });

  const sorted = events
    .filter((e) => !isNaN(e.timestamp.getTime()))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 15);

  container.innerHTML = sorted
    .map((e) => {
      const timeStr = e.timestamp.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const catBadge = e.category 
        ? `<span class="cat-pill" style="height:4px; width:4px; border-radius:50%; background:${getCategoryColor(e.category)}; display:inline-block; margin-right:4px;"></span>`
        : "";
      return `<div class="activity-item">
      <div class="activity-user" style="font-weight:600">${e.user}</div>
      <div class="activity-action" style="font-size:0.9em;color:var(--text-muted)">${catBadge}${e.activity}</div>
      <div class="activity-time">${timeStr}</div>
      <div class="activity-status"><span class="status-pill ${e.statusCls}"></span>${e.statusTxt}</div>
    </div>`;
    })
    .join("");
}

function getCategoryColor(cat) {
  const map = {
    residential:    "#0ea5e9",
    industrial:     "#64748b",
    agricultural:   "#f59e0b",
    commercial:     "#f97316",
    street_lighting: "#06b6d4",
    other:          "#22c55e"
  };
  return map[cat.toLowerCase().replace(" ", "_")] || "#64748b";
}

// ── Chart Switcher ───────────────────────────────────────────────
function setupChartSwitcher() {
  document.querySelectorAll(".admin-chart-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".admin-chart-tab")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      switchChart(btn.dataset.chart);
    });
  });
}

function switchChart(chartId) {
  // 1. Clear intervals to prevent memory leaks and crashes
  if (_rfInterval) {
    clearInterval(_rfInterval);
    _rfInterval = null;
  }

  // 2. Hide all containers and canvases
  const canvases = [
    "peakUsageChart",
    "categoryDonutChart",
    "trendLineChart",
    "hourlyForecastChart",
  ];
  canvases.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const rfCont = document.getElementById("rfLiveContainer");
  if (rfCont) rfCont.style.display = "none";

  // Switch tabs UI
  document
    .querySelectorAll(".admin-chart-tab")
    .forEach((t) => t.classList.remove("active"));
  const tab = document.querySelector(
    `.admin-chart-tab[data-chart="${chartId}"]`,
  );
  if (tab) tab.classList.add("active");

  // Show selected
  if (chartId === "peakUsage") {
    const el = document.getElementById("peakUsageChart");
    if (el) el.style.display = "block";
    renderPeakUsage();
  } else if (chartId === "categoryBreakdown") {
    const el = document.getElementById("categoryDonutChart");
    if (el) el.style.display = "block";
    renderCategoryBreakdown();
  } else if (chartId === "trendLine") {
    document.getElementById("trendLineChart").style.display = "block";
    renderTrendLine();
  } else if (chartId === "hourly") {
    document.getElementById("hourlyForecastChart").style.display = "block";
    renderHourlyForecast();
  } else if (chartId === "rfLive") {
    document.getElementById("rfLiveContainer").style.display = "block";
    renderRFLive();
  }
}

async function deleteAllPredictions() {
  if (
    !confirm(
      "CRITICAL: This will permanently delete ALL prediction records from the system. This action cannot be undone. Proceed?",
    )
  )
    return;

  try {
    const res = await fetch("/api/admin/predictions/all", { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      showToast("All predictions cleared successfully");
      loadData();
    } else {
      showToast(data.error || "Deletions failed", true);
    }
  } catch (err) {
    console.error(err);
    showToast("Network error during bulk delete", true);
  }
}

function renderGlobalIntelChart(chartType, data) {
  const canvas = document.getElementById("intelChart");
  if (!canvas) return;

  // Cleanup
  if (_intelInterval) {
    clearInterval(_intelInterval);
    _intelInterval = null;
  }
  if (_intelChartInst) {
    _intelChartInst.destroy();
    _intelChartInst = null;
  }

  const ctx = canvas.getContext("2d");

  if (chartType === "live") {
    // Live Intensity Stream logic
    const MAX_PTS = 50;
    const pts = new Array(MAX_PTS).fill(0).map(() => Math.random() * 40 + 30);
    const labels = new Array(MAX_PTS).fill("");

    _intelChartInst = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Real-time Intensity (MW)",
            data: pts,
            borderColor: "#00d4ff",
            backgroundColor: "rgba(0, 212, 255, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#64748b" },
          },
          x: { display: false },
        },
        plugins: { legend: { display: false } },
      },
    });

    _intelInterval = setInterval(() => {
      if (!_intelChartInst) {
        if (_intelInterval) clearInterval(_intelInterval);
        return;
      }
      const next = Math.random() * 40 + 30;
      pts.push(next);
      pts.shift();
      _intelChartInst.data.datasets[0].data = pts;
      _intelChartInst.update("none");
    }, 200);
  } else if (chartType === "dist") {
    // Category Distribution
    const counts = {};
    allPredictions.forEach((p) => {
      const cat = p.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    _intelChartInst = new Chart(ctx, {
      type: "polarArea",
      data: {
        labels: Object.keys(counts),
        datasets: [
          {
            data: Object.values(counts),
            backgroundColor: [
              "rgba(0, 212, 255, 0.5)",
              "rgba(34, 197, 94, 0.5)",
              "rgba(245, 158, 11, 0.5)",
              "rgba(239, 68, 68, 0.5)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { display: false },
          },
        },
        plugins: {
          legend: { position: "right", labels: { color: "#64748b" } },
        },
      },
    });
  } else {
    // Default Accuracy / Growth
    const pts = allPredictions
      .slice(0, 20)
      .reverse()
      .map((p) => p.growth_pct || 0);
    const labels = pts.map((_, i) => i + 1);

    _intelChartInst = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Load Variance Trend (%)",
            data: pts,
            borderColor: "#22c55e",
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });
  }
}

async function deletePrediction(id) {
  if (!confirm("Are you sure you want to delete this prediction record?"))
    return;
  try {
    const res = await fetch(`/api/admin/predictions/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      showToast("Prediction deleted");
      loadData();
    } else {
      showToast(data.error || "Deletion failed", true);
    }
  } catch (err) {
    console.error(err);
  }
}

// ─── CHARTS SECTION ──────────────────────────────────────────────

// Helper: Safely parse date and format for labels
function formatDateLabel(pred) {
  const raw = pred.created_at || pred.createdAt;
  if (!raw) return "Unknown";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function renderPeakUsage() {
  const canvas = document.getElementById("peakUsageChart");
  if (!canvas) return;
  if (_peakUsageChart) {
    _peakUsageChart.destroy();
    _peakUsageChart = null;
  }

  const labels = Array.from(new Set(allPredictions.map(p => formatDateLabel(p))))
    .filter(l => l !== "Unknown")
    .sort((a,b) => new Date(a) - new Date(b));

  const categories = ["Industrial", "Agricultural", "Commercial", "Residential"];
  const colorMap = {
    Industrial: "#f59e0b",
    Agricultural: "#22c55e",
    Commercial: "#0ea5e9",
    Residential: "#f43f5e"
  };

  const datasets = categories.map((cat) => {
    const data = labels.map((l) => {
      return allPredictions
        .filter((p) => {
          const d = formatDateLabel(p);
          const user = allUsers.find(u => String(u.id) === String(p.user_id || p.userId));
          const pCat = (p.category || user?.category || "Industrial").trim();
          return d === l && pCat.toLowerCase() === cat.toLowerCase();
        })
        .reduce((s, p) => s + (p.week_val || 0), 0);
    });

    return {
      label: cat,
      data: data,
      backgroundColor: colorMap[cat] || "#64748b",
      borderRadius: 4,
      barThickness: 12
    };
  });

  _peakUsageChart = new Chart(canvas, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { color: "#64748b", usePointStyle: true, boxWidth: 6, font: { size: 11 } } },
        tooltip: { backgroundColor: "#131929", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1 }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: "#64748b" } },
        y: { stacked: true, grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b" } }
      }
    }
  });
}

function renderCategoryBreakdown() {
  const canvas = document.getElementById("categoryDonutChart");
  if (!canvas) return;
  if (_categoryChart) {
    _categoryChart.destroy();
    _categoryChart = null;
  }

  const counts = {
    Industrial: 0,
    Agricultural: 0,
    Commercial: 0,
    Residential: 0,
    "Street Lighting": 0,
    Other: 0
  };

  allPredictions.forEach((p) => {
    const user = allUsers.find(u => String(u.id) === String(p.user_id || p.userId));
    let cat = (p.category || user?.category || "Industrial").trim();
    // Normalize case
    const match = Object.keys(counts).find(k => k.toLowerCase() === cat.toLowerCase());
    if (match) counts[match]++;
    else counts.Other++;
  });

  const labels = Object.keys(counts);
  const dataValues = Object.values(counts);
  const colorMap = {
    Industrial: "#64748b",
    Agricultural: "#f59e0b",
    Commercial: "#f97316",
    Residential: "#0ea5e9",
    "Street Lighting": "#06b6d4",
    Other: "#22c55e"
  };
  const colors = labels.map(l => colorMap[l]);

  _categoryChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { color: "#64748b", padding: 18, font: { size: 12 } } }
      },
      cutout: "68%"
    }
  });
}

function renderTrendLine() {
  const canvas = document.getElementById("trendLineChart");
  if (!canvas) return;
  if (_trendLineChart) {
    _trendLineChart.destroy();
    _trendLineChart = null;
  }

  const sorted = [...allPredictions].sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt));
  const labels = Array.from(new Set(sorted.map(p => formatDateLabel(p)))).filter(l => l !== "Unknown");

  const categories = ["Industrial", "Agricultural", "Commercial", "Residential", "Street Lighting", "Other"];
  const colorMap = {
    Industrial: "#64748b",
    Agricultural: "#f59e0b",
    Commercial: "#f97316",
    Residential: "#0ea5e9",
    "Street Lighting": "#06b6d4",
    Other: "#22c55e"
  };

  const datasets = categories.map((cat) => {
    const data = labels.map((l) => {
      const match = sorted.find((p) => {
        const d = formatDateLabel(p);
        const user = allUsers.find(u => String(u.id) === String(p.user_id || p.userId));
        const pCat = (p.category || user?.category || "Industrial").trim();
        return d === l && pCat.toLowerCase() === cat.toLowerCase();
      });
      return match ? match.week_val : null;
    });

    return {
      label: cat,
      data,
      borderColor: colorMap[cat],
      backgroundColor: colorMap[cat] + "1a",
      borderWidth: 2.5,
      tension: 0.4,
      fill: true,
      pointRadius: labels.length < 15 ? 4 : 0,
      spanGaps: true
    };
  });

  _trendLineChart = new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: "#64748b", font: { size: 11 }, usePointStyle: true, boxWidth: 6 } },
        tooltip: { backgroundColor: "#131929", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748b", maxTicksLimit: 8 } },
        y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b" } }
      }
    }
  });
}

function renderHourlyForecast() {
  const canvas = document.getElementById("hourlyForecastChart");
  if (!canvas) return;
  if (_hourlyForecastChart) {
    _hourlyForecastChart.destroy();
    _hourlyForecastChart = null;
  }

  const avgMonthly = allPredictions.reduce((s, p) => s + (p.month_val || 0), 0) / (allPredictions.length || 1);
  const avgDailyBase = avgMonthly / 30;

  const profile = [0.45, 0.42, 0.40, 0.38, 0.45, 0.55, 0.85, 1.10, 1.25, 1.35, 1.40, 1.30, 1.20, 1.15, 1.10, 1.25, 1.55, 1.85, 2.10, 2.25, 2.15, 1.65, 1.15, 0.75];
  const sum = profile.reduce((a, b) => a + b, 0);
  const hourlyData = profile.map(f => (f / sum) * avgDailyBase * 24);
  const labels = profile.map((_, i) => i.toString().padStart(2, "0") + ":00");

  _hourlyForecastChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Predicted Hourly Load (kWh)",
        data: hourlyData,
        borderColor: "#0ea5e9",
        backgroundColor: "rgba(14, 165, 233, 0.15)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "#131929", titleColor: "#e2e8f0", borderWidth: 1 }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748b", maxTicksLimit: 12 } },
        y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#64748b" } }
      }
    }
  });
}

function renderRFLive() {
  const canvas = document.getElementById("rfLiveChart");
  if (!canvas) return;
  if (_rfLiveChartInst) {
    _rfLiveChartInst.destroy();
    _rfLiveChartInst = null;
  }

  const MAX_PTS = 60;
  let pts = new Array(MAX_PTS).fill(null).map(() => +(Math.random() * 25 + 45).toFixed(2));
  const lbls = new Array(MAX_PTS).fill("");
  let tree2 = pts.map((v) => +(v + (Math.random() * 10 - 5)).toFixed(2));
  let tree3 = pts.map((v) => +(v + (Math.random() * 14 - 7)).toFixed(2));

  _rfLiveChartInst = new Chart(canvas, {
    type: "line",
    data: {
      labels: lbls,
      datasets: [
        { label: "Ensemble Mean", data: pts, borderColor: "#0ea5e9", backgroundColor: "rgba(14,165,233,0.07)", borderWidth: 2.5, tension: 0.3, pointRadius: 0, fill: true },
        { label: "Tree A", data: tree2, borderColor: "rgba(34,197,94,0.55)", borderWidth: 1, tension: 0.35, pointRadius: 0, fill: false },
        { label: "Tree B", data: tree3, borderColor: "rgba(245,158,11,0.45)", borderWidth: 1, tension: 0.35, pointRadius: 0, fill: false }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { labels: { color: "#64748b", font: { size: 11 } } }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { min: 10, max: 100, ticks: { color: "#64748b" } } }
    }
  });

  _rfInterval = setInterval(() => {
    if (!_rfLiveChartInst) {
      if (_rfInterval) clearInterval(_rfInterval);
      return;
    }
    pts.push(+(pts[pts.length-1] + (Math.random()*6-3)).toFixed(2)); pts.shift();
    tree2.push(+(tree2[tree2.length-1] + (Math.random()*8-4)).toFixed(2)); tree2.shift();
    tree3.push(+(tree3[tree3.length-1] + (Math.random()*10-5)).toFixed(2)); tree3.shift();
    _rfLiveChartInst.data.datasets[0].data = pts;
    _rfLiveChartInst.data.datasets[1].data = tree2;
    _rfLiveChartInst.data.datasets[2].data = tree3;
    _rfLiveChartInst.update("none");
  }, 120);
}

// ── Display Users ────────────────────────────────────────────────
function displayUsers() {
  const tbody = document.getElementById("usersTable");
  if (!tbody) return;

  if (allUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:32px">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = allUsers
    .map((u) => {
      // Fix Invalid Date issues
      const joinedDate = u.created_at ? new Date(u.created_at) : null;
      const joinedStr =
        joinedDate && !isNaN(joinedDate)
          ? joinedDate.toLocaleDateString()
          : "—";

      const roleBadge = u.isAdmin
        ? `<span class="status-badge info" style="background:rgba(0,212,255,0.15); color:var(--electric)">Admin</span>`
        : `<span class="status-badge success" style="background:rgba(0,208,132,0.15); color:#00d084">User</span>`;

      const avatar = u.profile_pic || "/static/images/default-avatar.png";

      return `<tr>
        <td>
          <div class="user-avatar-small" style="width:28px; height:28px; border-width:1.5px;">
            <img src="${avatar}" alt="Avatar" />
          </div>
        </td>
        <td style="font-weight:600">${u.fullname}</td>
        <td style="color:var(--text-muted)">${u.email}</td>
        <td>${u.organization || "—"}</td>
        <td>${u.city || "—"}</td>
        <td><span style="text-transform:capitalize">${u.category || "General"}</span></td>
        <td style="color:var(--text-muted)">${joinedStr}</td>
        <td>${roleBadge}</td>
        <td>
          <div class="action-buttons" style="display:flex; gap:8px;">
            ${roleAction}
            <button class="btn-sm btn-delete" onclick="openDeleteUser('${u.id}')">Delete</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

async function makeAdmin(userId) {
  if (!confirm("Are you sure you want to promote this user to Administrator?"))
    return;
  try {
    const res = await fetch(`/api/admin/users/${userId}/make_admin`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.success) {
      showToast("User promoted to Admin successfully");
      loadData();
    }
  } catch (err) {
    console.error(err);
  }
}

async function removeAdmin(userId) {
  if (userId == currentUser.id) {
    alert("You cannot demote yourself!");
    return;
  }
  if (!confirm("Remove administrative privileges from this user?")) return;
  try {
    const res = await fetch(`/api/admin/users/${userId}/remove_admin`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.success) {
      showToast("User demoted to regular account");
      loadData();
    }
  } catch (err) {
    console.error(err);
  }
}

// ── Display Predictions ──────────────────────────────────────────
function displayPredictions() {
  const tbody = document.getElementById("predictionsTable");
  if (!tbody) return;

  if (allPredictions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:32px">No predictions found.</td></tr>`;
    return;
  }

  tbody.innerHTML = allPredictions
    .map((p) => {
      const user = allUsers.find((u) => u.id === (p.user_id || p.userId));
      const name = p.user_fullname || user?.fullname || "Unknown";
      const date = p.created_at
        ? new Date(p.created_at).toLocaleDateString()
        : p.createdAt
          ? new Date(p.createdAt).toLocaleDateString()
          : "—";
      const g = p.growth_pct || 0;
      const gClr = g >= 0 ? "var(--success)" : "var(--danger)";
      const gTxt = (g > 0 ? "+" : "") + g + "%";
      const avatar = user?.profile_pic || "/static/images/default-avatar.png";

      return `<tr>
      <td>
        <div class="user-avatar-small" style="width:28px; height:28px; border-width:1.5px;">
          <img src="${avatar}" alt="Avatar" />
        </div>
      </td>
      <td style="font-weight:600">${name}</td>
      <td>${p.company_name || p.companyName || "—"}</td>
      <td>${p.city || "—"}</td>
      <td>${(p.week_val || 0).toFixed(1)}</td>
      <td>${(p.month_val || 0).toFixed(1)}</td>
      <td>${(p.year_val || 0).toFixed(1)}</td>
      <td><span style="color:${gClr};font-weight:700;font-size:0.9em">${gTxt}</span></td>
      <td style="color:var(--text-muted)">${date}</td>
      <td>
        <div class="action-buttons" style="display:flex; gap:8px;">
          <button class="btn-sm btn-view" onclick="viewPrediction('${p.id}')">Details</button>
          <button class="btn-sm btn-delete" onclick="deletePrediction('${p.id}')">Delete</button>
        </div>
      </td>
    </tr>`;
    })
    .join("");
}

// ── View User Modal ──────────────────────────────────────────────
function viewUser(userId) {
  const user = allUsers.find((u) => u.id == userId);
  if (!user) return;

  selectedUserId = userId;
  const preds = allPredictions.filter((p) => p.userId === user.id);
  const avatar = user.profile_pic || "/static/images/default-avatar.png";

  document.getElementById("modalTitle").textContent = "User Details";
  document.getElementById("modalBody").innerHTML = `
    <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid var(--border);">
      <div class="user-avatar-small" style="width:50px; height:50px; border-width:2px;">
         <img src="${avatar}" alt="User Avatar" />
      </div>
      <div>
         <h4 style="margin:0; font-size:1.1em; color:var(--text)">${user.fullname}</h4>
         <p style="margin:0; font-size:0.85em; color:var(--text-muted)">${user.email}</p>
      </div>
    </div>
    <p><strong>Organization</strong> ${user.organization || "—"}</p>
    <p><strong>City</strong> ${user.city || "—"}</p>
    <p><strong>Category</strong> <span style="color:${getCategoryColor(user.category || "Other")};font-weight:600">${user.category || "—"}</span></p>
    <p><strong>Joined</strong> ${user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
    <p><strong>Last Login</strong> ${user.last_login ? new Date(user.last_login).toLocaleString() : "—"}</p>
    <p><strong>Role</strong> <span style="color:var(--electric);font-weight:700">${user.isAdmin ? "Admin" : "User"}</span></p>
    <p><strong>Predictions</strong> ${preds.length}</p>
  `;
  document.getElementById("deleteBtn").style.display = "inline-flex";
  document.getElementById("detailModal").classList.add("active");
}

// ── View Prediction Modal ────────────────────────────────────────
function viewPrediction(predId) {
  const p = allPredictions.find((x) => x.id == predId);
  if (!p) return;

  const user = allUsers.find((u) => u.id === (p.user_id || p.userId));
  const name = p.user_fullname || user?.fullname || "Unknown";
  const avatar = user?.profile_pic || "/static/images/default-avatar.png";
  const g = p.growth_pct || 0;

  document.getElementById("modalTitle").textContent = "Prediction Details";
  document.getElementById("modalBody").innerHTML = `
    <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid var(--border);">
      <div class="user-avatar-small" style="width:50px; height:50px; border-width:2px;">
         <img src="${avatar}" alt="User Avatar" />
      </div>
      <div>
         <h4 style="margin:0; font-size:1.1em; color:var(--text)">${name}</h4>
         <p style="margin:0; font-size:0.85em; color:var(--text-muted)">Prediction Owner</p>
      </div>
    </div>
    <p><strong>Company</strong> ${p.company_name || p.companyName || "—"}</p>
    <p><strong>Category</strong> <span style="color:${getCategoryColor(p.category || "Other")};font-weight:600">${p.category || "—"}</span></p>
    <p><strong>City</strong> ${p.city || "—"}</p>
    <p><strong>Next Week</strong> ${(p.week_val || 0).toFixed(2)} kWh</p>
    <p><strong>Next Month</strong> ${(p.month_val || 0).toFixed(2)} kWh</p>
    <p><strong>Next Year</strong> ${(p.year_val || 0).toFixed(2)} kWh</p>
    <p><strong>Growth Trend</strong> <span style="color:${g >= 0 ? "var(--success)" : "var(--danger)"};font-weight:700">${(g > 0 ? "+" : "") + g}%</span></p>
    <p><strong>Generated</strong> ${p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</p>
  `;
  document.getElementById("deleteBtn").style.display = "none";
  document.getElementById("detailModal").classList.add("active");
}

// ── Make Admin ───────────────────────────────────────────────────
async function makeAdmin(userId) {
  if (!confirm("Make this user an Admin?")) return;
  try {
    const res = await fetch(`/api/admin/users/${userId}/make_admin`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.success) {
      showToast("User upgraded to Admin.");
      loadData();
    } else {
      showToast("Failed — unauthorized.", true);
    }
  } catch (e) {
    console.error(e);
  }
}

// ── Delete User ──────────────────────────────────────────────────
function openDeleteUser(userId) {
  selectedUserId = userId;
  viewUser(userId);
}

async function deleteUser() {
  if (!selectedUserId) return;
  try {
    const res = await fetch(`/api/admin/users/${selectedUserId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      closeModal();
      showToast("User deleted.");
      loadData();
    } else {
      showToast("Failed — unauthorized.", true);
    }
  } catch (e) {
    console.error(e);
  }
}

// ── Modal ────────────────────────────────────────────────────────
function closeModal() {
  document.getElementById("detailModal").classList.remove("active");
  selectedUserId = null;
}

window.addEventListener("click", (e) => {
  const modal = document.getElementById("detailModal");
  if (e.target === modal) closeModal();
});

// ── Settings ─────────────────────────────────────────────────────
function setupSettingsToggles() {
  const settings = JSON.parse(localStorage.getItem("adminSettings") || "{}");

  const notif = document.getElementById("notificationToggle");
  const email = document.getElementById("emailNotifications");
  const maint = document.getElementById("maintenanceMode");

  if (notif) {
    notif.checked = settings.notifications !== false;
    notif.addEventListener("change", function () {
      settings.notifications = this.checked;
      localStorage.setItem("adminSettings", JSON.stringify(settings));
      showToast(
        this.checked ? "Notifications enabled." : "Notifications disabled.",
      );
    });
  }
  if (email) {
    email.checked = settings.email !== false;
    email.addEventListener("change", function () {
      settings.email = this.checked;
      localStorage.setItem("adminSettings", JSON.stringify(settings));
      showToast(
        this.checked ? "Email reports enabled." : "Email reports disabled.",
      );
    });
  }
  if (maint) {
    maint.checked = settings.maintenance === true;
    maint.addEventListener("change", function () {
      settings.maintenance = this.checked;
      localStorage.setItem("adminSettings", JSON.stringify(settings));
      showToast(
        this.checked ? "Maintenance mode active." : "Maintenance mode off.",
      );
    });
  }
}

// ── Admin Info ───────────────────────────────────────────────────
function displayAdminInfo() {
  if (!currentUser) return;

  // Fill settings tab inputs
  const nameInp = document.getElementById("adminNameInput");
  const orgInp = document.getElementById("adminOrgInput");
  const joinedEl = document.getElementById("adminJoined");

  if (nameInp) nameInp.value = currentUser.fullname || "";
  if (orgInp) orgInp.value = currentUser.organization || "";

  if (joinedEl) {
    const d = new Date(currentUser.createdAt || currentUser.created_at);
    joinedEl.textContent = !isNaN(d) ? d.toLocaleDateString() : "—";
  }

  // Admin Account Avatar
  const accountAv = document.getElementById("adminAccountAvatar");
  if (accountAv) accountAv.src = currentUser.profile_pic || "/static/images/default-avatar.png";

  // Start real-time session stay timer
  startSessionTimer();
}

let sessionStartTime = Date.now();
function startSessionTimer() {
  const timerEl = document.getElementById("adminSessionTime");
  if (!timerEl || window._timerStarted) return;
  window._timerStarted = true;

  setInterval(() => {
    const diff = Date.now() - sessionStartTime;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    timerEl.textContent =
      String(h).padStart(2, "0") +
      ":" +
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0");
  }, 1000);
}

async function updateAdminProfile() {
  const fullname = document.getElementById("adminNameInput").value;
  const organization = document.getElementById("adminOrgInput").value;

  if (!fullname || !organization) {
    showToast("Please fill in all fields", true);
    return;
  }

  try {
    const res = await fetch("/api/admin/update_profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullname, organization }),
    });
    const data = await res.json();
    if (data.success) {
      showToast("Profile updated successfully");
      // Update local state
      currentUser.fullname = fullname;
      currentUser.organization = organization;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      updateAdminAuthUI();
    } else {
      showToast(data.error || "Update failed", true);
    }
  } catch (err) {
    console.error(err);
    showToast("Connection error", true);
  }
}

// ── Export Backup ────────────────────────────────────────────────
function exportBackup() {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          users: allUsers,
          predictions: allPredictions,
          ts: new Date().toISOString(),
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `energy_backup_${Date.now()}.json`,
  });
  a.click();
  const el = document.getElementById("lastBackup");
  if (el) el.textContent = new Date().toLocaleString();
  showToast("Backup exported.");
}

// ── Logout ───────────────────────────────────────────────────────
function logout() {
  window.location.href = "/auth/logout";
}

function setupLogoutButtons() {
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
  document.getElementById("logoutBtnHeader")?.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
}

// ── Toast notification ───────────────────────────────────────────
function showToast(msg, isError = false) {
  let toast = document.getElementById("adminToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "adminToast";
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "9999",
      padding: "12px 20px",
      borderRadius: "8px",
      fontFamily: "inherit",
      fontSize: "0.88em",
      fontWeight: "600",
      maxWidth: "320px",
      transition: "opacity 300ms, transform 300ms",
      opacity: "0",
      transform: "translateY(8px)",
    });
    document.body.appendChild(toast);
  }
  toast.style.background = isError
    ? "rgba(239,68,68,0.12)"
    : "rgba(34,197,94,0.12)";
  toast.style.color = isError ? "var(--danger)" : "var(--success)";
  toast.style.border = `1px solid ${isError ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`;
  toast.textContent = msg;
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
  }, 3000);
}

// ── Auth Profile popup helper ────────────────────────────────────
function updateProfilePopup() {
  fillProfilePopup();
}

// ── City map helper ──────────────────────────────────────────────
function buildCityMap() {
  return {
    karachi: "Karachi",
    lahore: "Lahore",
    islamabad: "Islamabad",
    rawalpindi: "Rawalpindi",
    faisalabad: "Faisalabad",
    multan: "Multan",
    peshawar: "Peshawar",
    quetta: "Quetta",
    sialkot: "Sialkot",
    gujranwala: "Gujranwala",
    hyderabad: "Hyderabad",
    abbottabad: "Abbottabad",
    sargodha: "Sargodha",
    sukkur: "Sukkur",
    larkana: "Larkana",
    bahawalpur: "Bahawalpur",
    mardan: "Mardan",
    mingaora: "Mingaora",
    gujrat: "Gujrat",
    jhelum: "Jhelum",
    khanewal: "Khanewal",
    kasur: "Kasur",
    sahiwal: "Sahiwal",
    okara: "Okara",
    mansehra: "Mansehra",
    dera_ismail: "Dera Ismail Khan",
    gilgit: "Gilgit",
    muzaffarabad: "Muzaffarabad",
    gwadar: "Gwadar",
    chitral: "Chitral",
  };
}

// ── Global Intelligence Popup ────────────────────────────────────
function openGlobalIntelligence() {
  const modal = document.getElementById("intelModal");
  if (!modal) return;
  modal.classList.add("active");
  renderGlobalIntelChart(_activeIntelTab);
}

function closeIntelModal() {
  document.getElementById("intelModal")?.classList.remove("active");
  if (_intelChartInst) {
    _intelChartInst.destroy();
    _intelChartInst = null;
  }
}

function switchIntelTab(tab, el) {
  _activeIntelTab = tab;
  document
    .querySelectorAll(".intel-nav-item")
    .forEach((i) => i.classList.remove("active"));
  el.classList.add("active");
  renderGlobalIntelChart(tab);
}

function renderGlobalIntelChart(tab) {
  const canvas = document.getElementById("intelMainChart");
  if (!canvas) return;
  if (_intelChartInst) _intelChartInst.destroy();

  let type = "line";
  let data = { labels: [], datasets: [] };
  let options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#64748b" } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b" } },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#64748b" },
      },
    },
  };

  if (tab === "cumulative") {
    const last7Days = [...new Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
    data.labels = last7Days;
    data.datasets = [
      {
        label: "Aggregate Intensity",
        data: last7Days.map(() => Math.floor(Math.random() * 500) + 200),
        borderColor: "#00d4ff",
        backgroundColor: "rgba(0,212,255,0.1)",
        fill: true,
        tension: 0.4,
      },
    ];
  } else if (tab === "categories") {
    type = "radar";
    data.labels = [
      "Residential",
      "Commercial",
      "Industrial",
      "General",
      "Enterprise",
      "Public",
      "Other",
    ];
    data.datasets = [
      {
        label: "Load Distribution",
        data: [85, 92, 78, 45, 60, 30, 15],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.1)",
      },
    ];
    options.scales = {};
  } else if (tab === "accuracy") {
    type = "bar";
    data.labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
    data.datasets = [
      {
        label: "Predicted",
        data: [420, 450, 480, 500],
        backgroundColor: "rgba(0,212,255,0.6)",
      },
      {
        label: "Variance",
        data: [415, 460, 475, 490],
        backgroundColor: "rgba(245,158,11,0.6)",
      },
    ];
  } else if (tab === "activity") {
    type = "line";
    data.labels = ["-60m", "-45m", "-30m", "-15m", "Now"];
    data.datasets = [
      {
        label: "User Pulsation",
        data: [5, 12, 8, 25, 18],
        borderColor: "#ef4444",
        tension: 0.5,
      },
    ];
  }

  _intelChartInst = new Chart(canvas, { type, data, options });
}

// Storage sync across tabs
window.addEventListener("storage", (e) => {
  if (e.key === "currentUser") {
    currentUser = window.currentUser || null;
    if (!currentUser) {
      window.location.href = "/";
      return;
    }
    updateAdminAuthUI();
    fillProfilePopup();
  }
});
