/**
 * statistics.js  — Energy Statistics Page
 *
 * Features:
 *   - Fetches all historical predictions from /api/predictions
 *   - Modern summary grid with an animated "Live" card featuring a progress bar
 *   - "Waterfall" consumption trend bar chart (Exclusive to stats page)
 *   - Category distribution doughnut chart
 *   - Interactive table with historical data
 */

let liveChart = null;
let donutChart = null;

// ───────────────────────────────────────────────────────────────
//  UTILITIES
// ───────────────────────────────────────────────────────────────
function animateNumber(el, target, suffix = " kWh", decimals = 2) {
  if (!el) return;
  const start = parseFloat(el.dataset.current || 0);
  const duration = 1000;
  const steps = 60;
  const diff = target - start;
  let step = 0;
  el.dataset.current = target;
  const timer = setInterval(() => {
    step++;
    const val = start + diff * (step / steps);
    el.textContent = val.toFixed(decimals) + suffix;
    if (step >= steps) clearInterval(timer);
  }, duration / steps);
}

// Component
function renderModernSummary(predictions) {
  const summaryGrid = document.getElementById("modernSummary");
  if (!summaryGrid) return;

  let totalWeekly = 0,
    totalMonthly = 0,
    totalYearly = 0;
  predictions.forEach((p) => {
    totalWeekly += (p.week_val || 0) / 1.05;
    totalMonthly += (p.month_val || 0) / 1.03;
    totalYearly += (p.year_val || 0) / 1.02;
  });

  const n = predictions.length || 1;
  const avgWk = totalWeekly / n;
  const avgMo = totalMonthly / n;
  const avgYr = totalYearly / n;

  // Latest prediction for LIVE card
  const latest = predictions.length ? predictions[0] : null;
  const latestWk = latest ? latest.week_val || 0 : 0;
  const company = latest ? latest.company_name : "";

  // Organization-specific historical norm
  let orgTotalWk = 0;
  let orgCount = 0;
  predictions.forEach((p) => {
    if (p.company_name === company) {
      orgTotalWk += p.week_val || 0;
      orgCount++;
    }
  });

  const orgAvgWk = orgCount > 0 ? orgTotalWk / orgCount : avgWk;
  const loadRatio = orgAvgWk > 0 ? latestWk / orgAvgWk : 1;
  const globalRatio = avgWk > 0 ? latestWk / avgWk : 1;

  // Progress Bar Logic (Live vs Org Avg)
  const loadPercentage = Math.min(100, Math.round(globalRatio * 100));
  const loadColor =
    loadRatio > 1.1 ? "#ff4757" : loadRatio > 0.9 ? "#00d4ff" : "#00d084";

  // Dynamic Efficiency Score based on historical month usage vs weekly prediction
  let efficiencyScore = 85; // Baseline
  if (latest && latest.week_val && latest.month_val) {
      const expectedMonth = latest.week_val * 4.33;
      const moRatio = latest.month_val / expectedMonth;
      efficiencyScore = Math.max(0, Math.min(100, Math.round(100 - (moRatio - 0.9) * 50)));
  }

  summaryGrid.innerHTML = `
    <!-- Card 1: Total -->
    <div class="stat-card stat-card-blue">
      <div class="stat-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
      </div>
      <div class="stat-info">
        <p class="stat-label">Total Predictions</p>
        <p class="stat-value">${predictions.length}</p>
        <p class="stat-sub">Lifetime analysis</p>
      </div>
    </div>

    <!-- Card 2: Avg Weekly -->
    <div class="stat-card stat-card-teal">
      <div class="stat-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      </div>
      <div class="stat-info">
        <p class="stat-label">Avg Weekly Baseline</p>
        <p class="stat-value" id="avgWeekly" data-current="0">—</p>
        <p class="stat-sub">Historical average</p>
      </div>
    </div>

    <!-- Card 3: Avg Monthly -->
    <div class="stat-card stat-card-green">
      <div class="stat-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>
      </div>
      <div class="stat-info">
        <p class="stat-label">Avg Monthly Baseline</p>
        <p class="stat-value" id="avgMonthly" data-current="0">—</p>
        <p class="stat-sub">Historical average</p>
      </div>
    </div>

    <!-- Card 4: LIVE PREDICTION BAR -->
    <div class="stat-card stat-card-live">
      <div class="live-badge">LIVE</div>
      <div class="stat-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--electric)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
      </div>
      <div class="stat-info">
        <p class="stat-label">Current Predicted Load</p>
        <p class="stat-value" id="liveWeekVal" data-current="0" style="color:var(--electric);">${latestWk.toFixed(2)} kWh</p>
        <p class="stat-sub" style="margin-bottom:8px;">Ref: ${latest ? latest.company_name : "N/A"}</p>
        
        <!-- THE NEW BAR CONCEPT -->
        <div class="live-gauge-wrap">
          <div class="live-gauge-fill" style="width:${loadPercentage}%; background:${loadColor};"></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:0.75em; color:var(--text-muted); font-weight:600;">
          <span>Load Intensity</span>
          <span>${loadPercentage}%</span>
        </div>
      </div>
      <div class="live-pulse"></div>
    </div>

    <!-- Card 5: Avg Yearly -->
    <div class="stat-card stat-card-purple">
      <div class="stat-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
      </div>
      <div class="stat-info">
        <p class="stat-label">Avg Yearly Baseline</p>
        <p class="stat-value" id="avgYearly" data-current="0">—</p>
        <p class="stat-sub">Historical average</p>
      </div>
    </div>

    <!-- Card 6: Efficiency Score -->
    <div class="stat-card stat-card-efficiency">
      <div class="stat-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
      </div>
      <div class="stat-info">
        <p class="stat-label">Energy Efficiency Score</p>
        <p class="stat-value" id="efficiencyVal">${efficiencyScore}<span style="font-size:0.55em; color:var(--text-muted);">/100</span></p>
        <p class="stat-sub">${loadRatio < 0.95 ? "Optimized" : loadRatio < 1.05 ? "Stable Baseline" : "High Usage Detected"}</p>
      </div>
      <div class="efficiency-bar"><div class="efficiency-fill" style="width:${Math.max(5, efficiencyScore)}%;"></div></div>
    </div>
  `;

  setTimeout(() => {
    animateNumber(document.getElementById("avgWeekly"), avgWk);
    animateNumber(document.getElementById("avgMonthly"), avgMo);
    animateNumber(document.getElementById("avgYearly"), avgYr);
  }, 100);
}

function renderTrendChart(predictions) {
  const canvas = document.getElementById("trendChart");
  if (!canvas || !window.Chart) return;
  if (liveChart) liveChart.destroy();

  const recent = [...predictions].slice(0, 10).reverse();
  const labels = recent.map((p) => p.company_name || "Entry");
  const wkData = recent.map((p) => p.week_val || 0);

  liveChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Weekly Prediction (kWh)",
          data: wkData,
          backgroundColor: "rgba(0, 212, 255, 0.7)",
          borderColor: "#00d4ff",
          borderWidth: 2,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#e0e0e0" } } },
      scales: {
        y: {
          grid: { color: "rgba(255,255,255,0.1)" },
          ticks: { color: "#a0a0a0" },
        },
        x: { grid: { display: false }, ticks: { color: "#a0a0a0" } },
      },
    },
  });
}

function renderDonutChart(predictions) {
  const canvas = document.getElementById("donutChart");
  if (!canvas || !window.Chart) return;
  if (donutChart) donutChart.destroy();

  const counts = {};
  predictions.forEach((p) => {
    const cat = p.category || "General";
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const data = Object.values(counts);

  donutChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#00d4ff",
            "#00d084",
            "#ff006e",
            "#a29bfe",
            "#ffa502",
          ],
          borderWidth: 0,
          hoverOffset: 12,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#e0e0e0", padding: 20, font: { size: 11 } },
        },
      },
      cutout: "70%",
    },
  });
}

function renderCategoryBreakdown(predictions) {
  const container = document.getElementById("categoryBreakdown");
  if (!container) return;

  const groups = {};
  predictions.forEach((p) => {
    const cat = p.category || "General";
    if (!groups[cat]) groups[cat] = { count: 0, totalWk: 0 };
    groups[cat].count++;
    groups[cat].totalWk += p.week_val || 0;
  });

  container.innerHTML = Object.entries(groups)
    .map(([name, data]) => {
      const avg = data.totalWk / data.count;
      const icon =
        name.toLowerCase() === "industrial"
          ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><circle cx="12" cy="14" r="4"></circle><line x1="12" y1="6" x2="12.01" y2="6"></line></svg>`
          : name.toLowerCase() === "commercial"
            ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>`
            : name.toLowerCase() === "residential"
              ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
              : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
      return `
      <div class="card cat-card">
        <div class="cat-header">
          <span class="cat-icon">${icon}</span>
          <span class="cat-name">${name}</span>
          <span class="cat-count">${data.count} entries</span>
        </div>
        <div class="cat-metrics">
          <div class="cat-metric">
            <span class="cat-metric-val">${avg.toFixed(1)}</span>
            <span class="cat-metric-label">Avg Weekly (kWh)</span>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderTable(predictions) {
  const table = document.getElementById("statsTable");
  if (!table) return;
  table.innerHTML = "";
  // Calculate global averages first as fallback
  let totalWkGlobal = 0;
  predictions.forEach(p => totalWkGlobal += (p.week_val || 0));
  const avgGlobalWk = predictions.length > 0 ? totalWkGlobal / predictions.length : 0;

  // Calculate organization-specific averages
  const orgAverages = {};
  predictions.forEach(p => {
    if (!orgAverages[p.company_name]) {
      orgAverages[p.company_name] = { total: 0, count: 0 };
    }
    orgAverages[p.company_name].total += (p.week_val || 0);
    orgAverages[p.company_name].count++;
  });

  predictions.forEach((p, idx) => {
    // Find immediate previous prediction for this company to calculate accurate short-term Growth %
    let prev = null;
    for (let i = idx + 1; i < predictions.length; i++) {
      if (predictions[i].company_name === p.company_name) {
        prev = predictions[i];
        break;
      }
    }
    
    // Determine the baseline to compare against
    let baselineWk = null;
    if (prev && prev.week_val > 0) {
        baselineWk = prev.week_val;
    } else if (orgAverages[p.company_name] && orgAverages[p.company_name].count > 1) {
        // Fallback to company average (excluding current) if possible
        const orgData = orgAverages[p.company_name];
        baselineWk = (orgData.total - (p.week_val || 0)) / (orgData.count - 1);
    } else if (avgGlobalWk > 0 && predictions.length > 1) {
        // Fallback to global average
        baselineWk = (totalWkGlobal - (p.week_val || 0)) / (predictions.length - 1);
    }

    let growthVal = "0.0";
    if (baselineWk && baselineWk > 0) {
      growthVal = (((p.week_val - baselineWk) / baselineWk) * 100).toFixed(1);
    }

    let isUp = false;
    let isDown = false;
    let growthColor = "#a0a0a0";
    let growthIcon = "−";
    let growthDisplayObj = "N/A";

    if (growthVal !== null) {
      const numGrowth = parseFloat(growthVal);
      isUp = numGrowth > 0;
      isDown = numGrowth < 0;
      growthColor = isUp ? "#ff4757" : isDown ? "#00d084" : "#a0a0a0";
      growthIcon = isUp ? "▲" : isDown ? "▼" : "−";
      growthDisplayObj = `${Math.abs(numGrowth).toFixed(1)}%`;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.company_name}</td>
      <td>${p.category || "General"}</td>
      <td>${p.city}</td>
      <td>${((p.week_val || 0) / 1.05).toFixed(2)}</td>
      <td>${((p.month_val || 0) / 1.03).toFixed(2)}</td>
      <td>${((p.year_val || 0) / 1.02).toFixed(2)}</td>
      <td><span style="color:var(--electric);">${(p.week_val || 0).toFixed(2)}</span></td>
      <td><span style="color:var(--electric);">${(p.month_val || 0).toFixed(2)}</span></td>
      <td><span style="color:#00d084;">${(p.year_val || 0).toFixed(2)}</span></td>
      <td><span style="color:${growthColor}; font-weight:700;">${growthIcon} ${growthDisplayObj}</span></td>
      <td>${new Date(p.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn-outline" style="padding: 4px 12px; font-size: 0.8em; cursor: pointer;" onclick="restorePrediction(${p.id})">
          Restore
        </button>
      </td>
    `;
    table.appendChild(row);
  });
}

function restorePrediction(id) {
  // Redirect to prediction page with a restoration ID
  window.location.href = `/prediction?restore_id=${id}`;
}

// ───────────────────────────────────────────────────────────────
//  INIT
// ───────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // Let main.js handle the general header/auth UI
  // But we still need to load predictions
  try {
    const res = await fetch("/api/predictions");
    const data = await res.json();
    if (data.success && data.predictions) {
      const predictions = data.predictions;
      renderModernSummary(predictions);
      renderTrendChart(predictions);
      renderDonutChart(predictions);
      renderCategoryBreakdown(predictions);
      renderTable(predictions);
    }
  } catch (err) {
    console.error("Stats loading failed", err);
  }
});
