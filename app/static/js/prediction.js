/**
 * prediction.js
 */

// city coordinates
const CITIES = {
  karachi: { name: "Karachi", lat: 24.86, lon: 67.01 },
  lahore: { name: "Lahore", lat: 31.5497, lon: 74.3436 },
  islamabad: { name: "Islamabad", lat: 33.6989, lon: 73.0369 },
  faisalabad: { name: "Faisalabad", lat: 31.418, lon: 73.079 },
  rawalpindi: { name: "Rawalpindi", lat: 33.6007, lon: 73.0679 },
  peshawar: { name: "Peshawar", lat: 34.0, lon: 71.5 },
  multan: { name: "Multan", lat: 30.1978, lon: 71.4711 },
  quetta: { name: "Quetta", lat: 30.192, lon: 67.007 },
  gujranwala: { name: "Gujranwala", lat: 32.15, lon: 74.1833 },
  hyderabad: { name: "Hyderabad", lat: 25.3969, lon: 68.3772 },
  sialkot: { name: "Sialkot", lat: 32.4914, lon: 74.5347 },
  sialkotcity: { name: "Sialkot City", lat: 32.5, lon: 74.5333 },
  bahawalpur: { name: "Bahawalpur", lat: 29.3956, lon: 71.6722 },
  sargodha: { name: "Sargodha", lat: 32.0836, lon: 72.6711 },
  abbottabad: { name: "Abbottabad", lat: 34.15, lon: 73.2167 },
  sukkur: { name: "Sukkur", lat: 27.6995, lon: 68.8673 },
  gilgit: { name: "Gilgit", lat: 35.9208, lon: 74.3144 },
  gwadar: { name: "Gwadar", lat: 25.1264, lon: 62.3225 },
};

// ═══════════════════════════════════════════════════════════════
//  CHART STATE
// ═══════════════════════════════════════════════════════════════
let activeChart = null;
let lastResult = null;
let currentChartType = "bar";

// ═══════════════════════════════════════════════════════════════
//  LOADER  (sleek fullscreen pop-up)
// ═══════════════════════════════════════════════════════════════
function showLoader() {
  const existing = document.getElementById("rfLoader");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "rfLoader";
  overlay.innerHTML = `
    <div class="rf-loader-inner">
      <div class="rf-spinner">
        <svg viewBox="0 0 80 80" width="80" height="80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(0,212,255,0.15)" stroke-width="6"/>
          <circle cx="40" cy="40" r="32" fill="none" stroke="#00d4ff" stroke-width="6"
                  stroke-dasharray="60 140" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate"
                              values="0 40 40;360 40 40" dur="1.1s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>
      <p class="rf-loader-title">Running Random Forest Model</p>
      <div class="rf-loader-steps">
        <div class="rf-step" id="step1">Fetching live weather data…</div>
        <div class="rf-step" id="step2">Training 300 decision trees…</div>
        <div class="rf-step" id="step3">Computing feature importances…</div>
        <div class="rf-step" id="step4">Generating predictions…</div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // Animate steps sequentially
  const steps = [1, 2, 3, 4];
  steps.forEach((n, i) => {
    setTimeout(() => {
      const el = document.getElementById(`step${n}`);
      if (el) el.classList.add("rf-step-active");
    }, i * 700);
  });
}

function hideLoader() {
  const el = document.getElementById("rfLoader");
  if (el) {
    el.classList.add("rf-loader-fade-out");
    setTimeout(() => el.remove(), 400);
  }
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PREDICTION CALL
// ═══════════════════════════════════════════════════════════════
async function runPrediction(e) {
  e.preventDefault();

  const weekKwh = parseFloat(
    document.getElementById("weekLoad")?.value ||
      document.getElementById("prevWeekLoad")?.value ||
      0,
  );
  const monthKwh = parseFloat(
    document.getElementById("monthLoad")?.value ||
      document.getElementById("prevMonthLoad")?.value ||
      0,
  );
  const yearKwh = parseFloat(
    document.getElementById("yearLoad")?.value ||
      document.getElementById("prevYearLoad")?.value ||
      0,
  );
  const city = document.getElementById("city")?.value || "karachi";
  const company =
    document.getElementById("companyName")?.value ||
    document.getElementById("company_name")?.value ||
    "My Company";
  const category = document.getElementById("category")?.value || "general";

  if (!weekKwh || !monthKwh || !yearKwh) {
    showAlert("Please fill in all three historical kWh fields.", "error");
    return;
  }

  // Connectivity Check
  if (!navigator.onLine) {
    showAlert(
      "No internet connection. Prediction require live weather data to function.",
      "error",
    );
    showOfflineOverlay();
    return;
  }

  showLoader();

  // Disable submit button
  const btn =
    document.getElementById("predictBtn") ||
    document.querySelector('[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Predicting…";
  }

  try {
    const res = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_kwh: weekKwh,
        month_kwh: monthKwh,
        year_kwh: yearKwh,
        city,
        company_name: company,
        category,
      }),
    });

    const data = await res.json();
    hideLoader();

    if (!data.success) {
      showAlert(
        "Prediction failed: " + (data.error || "Unknown error"),
        "error",
      );
      return;
    }

    lastResult = data;
    renderResults(data, company, city);
    loadHistory(); // Refresh history list after new successful prediction
  } catch (err) {
    hideLoader();
    showAlert("Network error: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Generate Forecast";
    }
  }
}

// live weather s
async function updateLiveWeatherInfo() {
  const citySelect = document.getElementById("city");
  const cityKey = citySelect.value;
  const previewDiv = document.getElementById("liveWeatherPreview");

  if (!cityKey) {
    previewDiv.style.display = "none";
    return;
  }

  // Set city name immediately
  const cityNameEl = document.getElementById("previewCityName");
  if (cityNameEl) {
    cityNameEl.textContent = CITIES[cityKey]?.name || cityKey;
  }

  // Show loading state
  const tempEl = document.getElementById("prevTemp");
  const humEl = document.getElementById("prevHum");
  const windEl = document.getElementById("prevWind");
  const cloudEl = document.getElementById("prevCloud");

  if (tempEl) tempEl.textContent = "…";
  if (humEl) humEl.textContent = "…";
  if (windEl) windEl.textContent = "…";
  if (cloudEl) cloudEl.textContent = "…";

  previewDiv.style.display = "block";

  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(cityKey)}`);
    const data = await res.json();

    if (data.success && data.weather) {
      if (tempEl)
        tempEl.textContent = `${data.weather.temperature.toFixed(1)}°C`;
      if (humEl) humEl.textContent = `${data.weather.humidity}%`;
      if (windEl) windEl.textContent = `${data.weather.wind_speed}km/h`;
      if (cloudEl) cloudEl.textContent = `${data.weather.cloud_cover}%`;
    } else {
      throw new Error("Invalid weather data");
    }
  } catch (err) {
    console.error("Failed to fetch live weather", err);
    if (tempEl) tempEl.textContent = "—";
    if (humEl) humEl.textContent = "—";
    if (windEl) windEl.textContent = "—";
    if (cloudEl) cloudEl.textContent = "—";
  }
}

// ═══════════════════════════════════════════════════════════════
//  RENDER RESULTS
// ═══════════════════════════════════════════════════════════════
function renderResults(data, company, cityKey) {
  const panel = document.getElementById("resultsPanel");
  if (!panel) return;

  panel.style.display = "block";
  panel.scrollIntoView({ behavior: "smooth", block: "start" });

  const p = data.predictions;
  const w = data.weather;
  const exp = data.explanation;
  const city = CITIES[cityKey] || { name: cityKey, lat: "—", lon: "—" };

  // ── Prediction summary cards ──────────────────────────────
  const summaryEl = document.getElementById("predSummary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="pred-card pred-card-week">
        <div class="pred-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <div class="pred-label">Next Week</div>
        <div class="pred-value">${p.next_week.toLocaleString()} <span class="pred-unit">kWh</span></div>
        <div class="pred-growth ${p.growth_week >= 0 ? "growth-up" : "growth-down"}">
          ${p.growth_week >= 0 ? "▲" : "▼"} ${Math.abs(p.growth_week)}% vs historical
        </div>
      </div>
      <div class="pred-card pred-card-month">
        <div class="pred-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>
        </div>
        <div class="pred-label">Next Month</div>
        <div class="pred-value">${p.next_month.toLocaleString()} <span class="pred-unit">kWh</span></div>
        <div class="pred-growth ${p.growth_month >= 0 ? "growth-up" : "growth-down"}">
          ${p.growth_month >= 0 ? "▲" : "▼"} ${Math.abs(p.growth_month)}% vs historical
        </div>
      </div>
      <div class="pred-card pred-card-year">
        <div class="pred-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        </div>
        <div class="pred-label">Next Year</div>
        <div class="pred-value">${p.next_year.toLocaleString()} <span class="pred-unit">kWh</span></div>
        <div class="pred-growth ${p.growth_year >= 0 ? "growth-up" : "growth-down"}">
          ${p.growth_year >= 0 ? "▲" : "▼"} ${Math.abs(p.growth_year)}% vs historical
        </div>
      </div>`;
  }

  // ── Weather panel ──────────────────────────────────────────
  const weatherEl = document.getElementById("predWeather");
  if (weatherEl) {
    weatherEl.innerHTML = `
      <div class="weather-row">
        <span class="weather-item"><strong>${w.temperature}°C</strong> Temperature</span>
        <span class="weather-item"><strong>${w.humidity}%</strong> Humidity</span>
        <span class="weather-item"><strong>${w.wind_speed} km/h</strong> Wind</span>
        <span class="weather-item"><strong>${w.precipitation} mm</strong> Precipitation</span>
        <span class="weather-item"><strong>${w.cloud_cover}%</strong> Cloud Cover</span>
        <span class="weather-item"><strong>${city.name}</strong> ${w.lat.toFixed(4)}°N ${w.lon.toFixed(4)}°E</span>
      </div>
      <div class="weather-source">Source: ${w.source}</div>`;
  }

  // ── Model explanation ──────────────────────────────────────
  const explainEl = document.getElementById("predExplanation");
  if (explainEl) {
    // Show all features to demonstrate weather integration
    const importanceBars = data.feature_importance
      .map(
        (f) => `
      <div class="feat-row ${f.feature.toLowerCase().includes("kwh") ? "" : "feat-weather"}">
        <span class="feat-name">${f.feature}</span>
        <div class="feat-bar-wrap">
          <div class="feat-bar" style="width:${((f.importance * 100) / data.feature_importance[0].importance).toFixed(1)}%"></div>
        </div>
        <span class="feat-pct">${(f.importance * 100).toFixed(1)}%</span>
      </div>`,
      )
      .join("");

    explainEl.innerHTML = `
      <div class="explain-header">
        <span class="tag-algo">${exp.algorithm}</span>
        <span class="tag-stat">${exp.n_estimators} Trees</span>
        <span class="tag-stat">${exp.training_samples} Samples</span>
        <span class="tag-stat">${exp.features_used} Features</span>
      </div>
      <p class="explain-summary">${exp.model_summary}</p>
      <h4 class="feat-title">Feature Importances</h4>
      <div class="feat-list">${importanceBars}</div>
      <div class="explain-weather-pct">
        Weather data contributed <strong>${exp.weather_impact_pct}%</strong> of predictive power
      </div>`;
  }

  // ── Chart ──────────────────────────────────────────────────
  renderChart(data.daily_forecasts, currentChartType);
}

// ═══════════════════════════════════════════════════════════════
//  CHART  (Chart.js — multi-graph switcher)
// ═══════════════════════════════════════════════════════════════
function renderChart(forecasts, type = "bar") {
  const canvas = document.getElementById("forecastChart");
  if (!canvas) return;

  const labels = forecasts.map((d) => d.day);
  const kwh = forecasts.map((d) => d.kwh);
  const temps = forecasts.map((d) => d.temp);

  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
  }

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "rgba(0,212,255,0.6)");
  gradient.addColorStop(1, "rgba(0,212,255,0.02)");

  const datasets = [
    {
      label: "Predicted kWh",
      data: kwh,
      backgroundColor: type === "line" ? gradient : "rgba(0,212,255,0.7)",
      borderColor: "#00d4ff",
      borderWidth: 2,
      fill: type === "line",
      tension: 0.4,
      pointBackgroundColor: "#00d4ff",
      pointRadius: 5,
      yAxisID: "y",
    },
    {
      label: "Temperature (°C)",
      data: temps,
      type: "line",
      backgroundColor: "rgba(255,0,110,0.15)",
      borderColor: "#ff006e",
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointBackgroundColor: "#ff006e",
      pointRadius: 4,
      yAxisID: "y1",
    },
  ];

  activeChart = new Chart(ctx, {
    type: type === "radar" ? "radar" : type,
    data: { labels, datasets: type === "radar" ? [datasets[0]] : datasets },
    options: {
      responsive: true,
      animation: { duration: 800, easing: "easeInOutQuart" },
      plugins: {
        legend: { labels: { color: "#e0e0e0", font: { size: 13 } } },
        tooltip: {
          backgroundColor: "rgba(26,31,58,0.95)",
          borderColor: "#00d4ff",
          borderWidth: 1,
          titleColor: "#00d4ff",
          bodyColor: "#e0e0e0",
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2) ?? ctx.parsed.r?.toFixed(2)}`,
          },
        },
      },
      scales:
        type === "radar"
          ? {
              r: {
                pointLabels: { color: "#e0e0e0" },
                ticks: { color: "#a0a0a0" },
                grid: { color: "#2a2f4a" },
              },
            }
          : {
              y: {
                type: "linear",
                position: "left",
                title: { display: true, text: "kWh / day", color: "#00d4ff" },
                ticks: { color: "#a0a0a0" },
                grid: { color: "rgba(42,47,74,0.6)" },
              },
              y1: {
                type: "linear",
                position: "right",
                title: { display: true, text: "Temp (°C)", color: "#ff006e" },
                ticks: { color: "#a0a0a0" },
                grid: { drawOnChartArea: false },
              },
              x: {
                ticks: { color: "#a0a0a0" },
                grid: { color: "rgba(42,47,74,0.4)" },
              },
            },
    },
  });
}

function switchChart(type) {
  currentChartType = type;
  document
    .querySelectorAll(".chart-btn")
    .forEach((b) => b.classList.remove("active"));
  document.querySelector(`[data-chart="${type}"]`)?.classList.add("active");
  if (lastResult) renderChart(lastResult.daily_forecasts, type);
}

// ═══════════════════════════════════════════════════════════════
//  ALERT HELPER
// ═══════════════════════════════════════════════════════════════
function showAlert(msg, type = "error") {
  const el = document.getElementById("alertContainer");
  if (!el) return;
  el.innerHTML = `<div class="pred-alert pred-alert-${type}">${msg}</div>`;
  setTimeout(() => (el.innerHTML = ""), 5000);
}

// ═══════════════════════════════════════════════════════════════
//  HISTORY PANEL LOGIC
// ═══════════════════════════════════════════════════════════════
let predictionHistory = [];

async function loadHistory() {
  try {
    const res = await fetch("/api/predictions");
    const data = await res.json();
    if (data.success) {
      predictionHistory = data.predictions;
      renderHistoryList();
    }
  } catch (err) {
    console.error("History load failed", err);
  }
}

function renderHistoryList() {
  const list = document.getElementById("historyList");
  if (!list) return;

  if (predictionHistory.length === 0) {
    list.innerHTML = `<div class="empty-history" style="text-align: center; color: var(--text-gray); margin-top: 40px;">No past predictions found.</div>`;
    return;
  }

  list.innerHTML = predictionHistory
    .map((p, index) => {
      const date = new Date(p.created_at).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return `
      <div class="history-item" onclick="restoreFromHistory(${index})">
        <div class="date">${date}</div>
        <div class="info">${p.company_name || "Unknown"} — ${p.city}</div>
        <div class="val">${p.week_val.toFixed(0)} <span style="font-size:0.7em;">kWh/wk</span></div>
      </div>
    `;
    })
    .join("");
}

function restoreFromHistory(index) {
  const p = predictionHistory[index];
  if (!p) return;

  let fullData;
  try {
    fullData =
      typeof p.insights === "string" ? JSON.parse(p.insights) : p.insights;
  } catch (e) {
    showAlert("Could not restore data: invalid format.", "error");
    return;
  }

  // Handle old items that only saved summary
  if (!fullData || !fullData.predictions) {
    showAlert(
      "This item only contains a summary and cannot be fully restored.",
      "error",
    );
    return;
  }

  // Pre-fill the form fields with the restored data
  const companyInput = document.getElementById("companyName") || document.getElementById("company_name");
  if (companyInput) companyInput.value = p.company_name || "";

  const citySelect = document.getElementById("city");
  if (citySelect) {
      citySelect.value = p.city || "karachi";
      if (typeof updateLiveWeatherInfo === 'function') {
          updateLiveWeatherInfo();
      }
  }

  const catSelect = document.getElementById("category");
  if (catSelect) catSelect.value = p.category || "general";

  // Attempt to pre-fill historical load data (if saved previously)
  // If not structurally guaranteed, try looking in fullData or just set to prediction base divided
  const wkInput = document.getElementById("weekLoad") || document.getElementById("prevWeekLoad");
  const moInput = document.getElementById("monthLoad") || document.getElementById("prevMonthLoad");
  const yrInput = document.getElementById("yearLoad") || document.getElementById("prevYearLoad");
  
  if (wkInput) wkInput.value = fullData.historical_inputs ? fullData.historical_inputs.week : (p.week_val / 1.05).toFixed(2);
  if (moInput) moInput.value = fullData.historical_inputs ? fullData.historical_inputs.month : (p.month_val / 1.03).toFixed(2);
  if (yrInput) yrInput.value = fullData.historical_inputs ? fullData.historical_inputs.year : (p.year_val / 1.02).toFixed(2);

  showAlert("Prediction restored successfully from history.", "success");

  lastResult = fullData;
  renderResults(fullData, p.company_name, p.city);
  toggleHistory(false);
}

function toggleHistory(force) {
  const sidebar = document.getElementById("historySidebar");
  const overlay = document.getElementById("historyOverlay");
  const isActive =
    typeof force === "boolean" ? force : !sidebar.classList.contains("active");

  if (isActive) {
    sidebar.classList.add("active");
    overlay.classList.add("active");
    loadHistory(); // Refresh on open
  } else {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("predictionForm");
  if (form) form.addEventListener("submit", runPrediction);

  // Chart switcher buttons
  document.querySelectorAll(".chart-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchChart(btn.dataset.chart));
  });

  // History Toggle
  document
    .getElementById("historyToggleBtn")
    ?.addEventListener("click", () => toggleHistory());
  document
    .getElementById("closeHistory")
    ?.addEventListener("click", () => toggleHistory(false));
  document
    .getElementById("historyOverlay")
    ?.addEventListener("click", () => toggleHistory(false));

  // Initial history load
  loadHistory().then(() => {
    // Check for restoration ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const restoreId = urlParams.get("restore_id");
    if (restoreId) {
      const index = predictionHistory.findIndex((p) => p.id == restoreId);
      if (index !== -1) {
        restoreFromHistory(index);
        // Clean up URL without reload
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    }
  });

  // Connectivity Sync
  updateOnlineStatus();
});

// ═══════════════════════════════════════════════════════════════
//  OFFLINE HANDLING
// ═══════════════════════════════════════════════════════════════
function showOfflineOverlay() {
  const existing = document.getElementById("offlineOverlay");
  if (existing) return;

  const overlay = document.createElement("div");
  overlay.id = "offlineOverlay";
  overlay.className = "offline-status-overlay";
  overlay.innerHTML = `
    <div class="offline-card">
      <div class="offline-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--electric)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
      </div>
      <h2>Connection Lost</h2>
      <p>Precision energy forecasting requires live weather data. Please check your internet connection to continue.</p>
      <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">Dismiss</button>
    </div>`;
  document.body.appendChild(overlay);
}

function updateOnlineStatus() {
  const badge = document.getElementById("networkStatus");
  if (!badge) return;

  if (navigator.onLine) {
    badge.innerHTML = `<span class="status-dot status-online"></span> Online`;
    const overlay = document.getElementById("offlineOverlay");
    if (overlay) overlay.remove();
  } else {
    badge.innerHTML = `<span class="status-dot status-offline"></span> Offline`;
    showOfflineOverlay();
  }
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
