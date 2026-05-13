/**
 * statistics.js - Advanced Energy Analytics Dashboard
 * 
 * Features:
 * - Multi-metric Trend Analysis with Tab Switcher
 * - Weighted Category Distribution (Doughnut)
 * - Geographic Intensity Analysis (Horizontal Bar)
 * - Real-time Data Sync & Cache-Busting
 */

let charts = {
  trend: null,
  donut: null,
  city: null
};

let allPredictions = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentMetric = 'weekly';

// ── UTILITIES ──────────────────────────────────────────────────

function formatNumber(num) {
  return new Intl.NumberFormat().format(num.toFixed(2));
}

function getMetricLabel(metric) {
  const labels = {
    weekly: 'Weekly Usage (kWh)',
    monthly: 'Monthly Norm. (kWh)',
    yearly: 'Yearly Norm. (kWh)'
  };
  return labels[metric] || 'Usage (kWh)';
}

// ── DATA PROCESSING ───────────────────────────────────────────

function calcEfficiencyScore(predictions) {
  if (predictions.length < 2) return 85; // Baseline
  const latest = predictions[0];
  const avgWk = predictions.reduce((a, b) => a + (b.week_val || 0), 0) / predictions.length;
  
  // Factor 1: Load Consistency (40%)
  const expectedMonthly = latest.week_val * 4.33;
  const devMo = Math.abs(latest.month_val - expectedMonthly) / (expectedMonthly || 1);
  const f1 = Math.max(0, 100 - (devMo * 100));

  // Factor 2: Intensity vs History (60%)
  const devHist = Math.abs(latest.week_val - avgWk) / (avgWk || 1);
  const f2 = Math.max(0, 100 - (devHist * 50));

  return Math.round((f1 * 0.4) + (f2 * 0.6));
}

function processCityData(predictions) {
  const cities = {};
  predictions.forEach(p => {
    if (!cities[p.city]) cities[p.city] = { total: 0, count: 0 };
    cities[p.city].total += p.week_val || 0;
    cities[p.city].count++;
  });
  
  return Object.entries(cities)
    .map(([name, data]) => ({ name, avg: data.total / data.count }))
    .sort((a, b) => b.avg - a.avg);
}

// ── CHART RENDERING ───────────────────────────────────────────

function initTrendChart(predictions) {
  const ctx = document.getElementById('trendChart')?.getContext('2d');
  if (!ctx) return;

  const recent = [...predictions].slice(0, 15).reverse();
  const labels = recent.map(p => p.company_name || 'Entry');
  
  const datasets = [
    {
      label: 'Weekly Forecast',
      data: recent.map(p => p.week_val),
      backgroundColor: '#00d4ff',
      borderRadius: 4,
      hidden: false
    },
    {
      label: 'Monthly Norm.',
      data: recent.map(p => p.month_val / 4.33),
      backgroundColor: '#00d084',
      borderRadius: 4,
      hidden: true
    },
    {
      label: 'Yearly Norm.',
      data: recent.map(p => p.year_val / 52.14),
      backgroundColor: '#f59e0b',
      borderRadius: 4,
      hidden: true
    }
  ];

  if (charts.trend) charts.trend.destroy();
  
  charts.trend = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      barPercentage: 0.6,
      categoryPercentage: 0.8,
      interaction: { mode: 'index', intersect: false },
      hover: { mode: 'index', intersect: false },
      plugins: {
        legend: { 
          display: true, 
          position: 'top', 
          align: 'end',
          labels: { 
            color: '#94a3b8', 
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            font: { size: 12, weight: '500' }
          } 
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: '#00d4ff',
          bodyColor: '#f1f5f9',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 14,
          cornerRadius: 10,
          usePointStyle: true,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)} kWh`
          }
        }
      },
      scales: {
        y: { 
          grid: { color: 'rgba(148, 163, 184, 0.05)', drawBorder: false }, 
          ticks: { color: '#94a3b8', padding: 10 } 
        },
        x: { 
          grid: { display: false }, 
          ticks: { color: '#94a3b8', padding: 10 } 
        }
      },
      animations: {
        y: { duration: 2000, easing: 'easeOutQuart' }
      }
    }
  });
}

function updateTrendMetric(metric) {
  if (!charts.trend) return;
  const ds = charts.trend.data.datasets;
  
  if (metric === 'all') {
    ds.forEach(d => d.hidden = false);
  } else {
    ds[0].hidden = metric !== 'weekly';
    ds[1].hidden = metric !== 'monthly';
    ds[2].hidden = metric !== 'yearly';
  }
  charts.trend.update();
}

function initDonutChart(predictions) {
  const ctx = document.getElementById('donutChart')?.getContext('2d');
  if (!ctx) return;

  const categories = {};
  predictions.forEach(p => {
    const cat = p.category || 'General';
    if (!categories[cat]) categories[cat] = 0;
    categories[cat] += p.week_val || 0;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const colors = ['#0ea5e9', '#6366f1', '#f59e0b', '#00d084', '#ff4757', '#8b5cf6'];

  if (charts.donut) charts.donut.destroy();

  charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          padding: 12,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatNumber(ctx.parsed)} kWh`
          }
        }
      }
    }
  });

  // Custom Legend
  const legendDiv = document.getElementById('donutLegendExt');
  if (legendDiv) {
    legendDiv.innerHTML = labels.map((l, i) => `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; font-size:0.85em;">
        <span style="width:10px; height:10px; border-radius:50%; background:${colors[i%colors.length]}"></span>
        <span style="color:var(--text-muted)">${l}</span>
        <span style="margin-left:auto; font-weight:600; color:var(--text)">${((data[i] / data.reduce((a,b)=>a+b,0)) * 100).toFixed(1)}%</span>
      </div>
    `).join('');
  }
}

function initCityChart(predictions) {
  const ctx = document.getElementById('cityChart')?.getContext('2d');
  if (!ctx) return;

  const cities = processCityData(predictions);

  if (charts.city) charts.city.destroy();

  charts.city = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: cities.map(c => c.name),
      datasets: [{
        label: 'Avg Weekly Load',
        data: cities.map(c => c.avg),
        backgroundColor: '#6366f1',
        borderRadius: 5,
        indexAxis: 'y'
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } },
        y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
      }
    }
  });
}

// ── UI UPDATES ────────────────────────────────────────────────

function updateStatsSummary(predictions) {
  const latest = predictions[0] || {};
  const total = predictions.length;
  
  const avgW = predictions.reduce((a, b) => a + (b.week_val || 0), 0) / (total || 1);
  const avgM = predictions.reduce((a, b) => a + (b.month_val || 0), 0) / (total || 1);
  const avgY = predictions.reduce((a, b) => a + (b.year_val || 0), 0) / (total || 1);

  const efficiency = calcEfficiencyScore(predictions);
  const loadRatio = avgW > 0 ? (latest.week_val || 0) / avgW : 1;
  const loadPercentage = Math.min(100, Math.round(loadRatio * 100));

  // Update DOM Elements
  const els = {
    total: document.getElementById('totalPredictions'),
    avgW: document.getElementById('avgWeekly'),
    avgM: document.getElementById('avgMonthly'),
    avgY: document.getElementById('avgYearly'),
    live: document.getElementById('liveWeekVal'),
    eff: document.getElementById('efficiencyVal'),
    effSub: document.getElementById('efficiencySub'),
    liveBar: document.getElementById('liveGaugeFill')
  };

  if (els.total) els.total.textContent = total;
  if (els.avgW) els.avgW.textContent = formatNumber(avgW) + ' kWh';
  if (els.avgM) els.avgM.textContent = formatNumber(avgM) + ' kWh';
  if (els.avgY) els.avgY.textContent = formatNumber(avgY) + ' kWh';
  
  if (els.live) {
    els.live.textContent = formatNumber(latest.week_val || 0) + ' kWh';
    els.live.style.color = loadRatio > 1.2 ? '#ff4757' : (loadRatio < 0.8 ? '#00d084' : '#00d4ff');
  }

  if (els.eff) {
    els.eff.textContent = efficiency;
    els.eff.style.color = efficiency > 80 ? '#00d084' : (efficiency > 50 ? '#f59e0b' : '#ff4757');
  }

  if (els.effSub) {
    els.effSub.textContent = efficiency > 80 ? 'Optimized Performance' : (efficiency > 50 ? 'Stable Usage' : 'High Variance Detected');
  }

  // Update live gauge if exists
  const liveFill = document.querySelector('.live-gauge-fill');
  if (liveFill) {
    liveFill.style.width = `${loadPercentage}%`;
    liveFill.style.background = loadRatio > 1.2 ? '#ff4757' : '#00d4ff';
  }
}

function renderTable(predictions, page = 1) {
  const tbody = document.getElementById('statsTable');
  if (!tbody) return;

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginated = predictions.slice(start, end);

  const startIdxEl = document.getElementById('startIndex');
  const endIdxEl = document.getElementById('endIndex');
  const totalItemsEl = document.getElementById('totalItems');

  if (startIdxEl) startIdxEl.textContent = predictions.length ? start + 1 : 0;
  if (endIdxEl) endIdxEl.textContent = Math.min(end, predictions.length);
  if (totalItemsEl) totalItemsEl.textContent = predictions.length;

  tbody.innerHTML = paginated.map(p => `
    <tr>
      <td>${p.company_name}</td>
      <td><span class="badge">${p.category}</span></td>
      <td>${p.city}</td>
      <td>${formatNumber(p.week_val)}</td>
      <td>${formatNumber(p.month_val)}</td>
      <td>${formatNumber(p.year_val)}</td>
      <td><span style="color:var(--electric)">${formatNumber(p.week_val)}</span></td>
      <td>${formatNumber(p.month_val)}</td>
      <td>${formatNumber(p.year_val)}</td>
      <td style="color:${p.growth_pct >= 0 ? 'var(--danger)' : 'var(--success)'}">
        ${p.growth_pct >= 0 ? '▲' : '▼'} ${Math.abs(p.growth_pct || 0).toFixed(1)}%
      </td>
      <td>${new Date(p.created_at).toLocaleDateString()}</td>
      <td><button class="btn-sm btn-outline" onclick="window.location.href='/prediction?restore_id=${p.id}'">Restore</button></td>
    </tr>
  `).join('');
  
  // Pagination buttons
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  if (prevBtn) prevBtn.disabled = page === 1;
  if (nextBtn) nextBtn.disabled = end >= predictions.length;
}

function renderCategoryBreakdown(predictions) {
  const container = document.getElementById('categoryBreakdown');
  if (!container) return;

  const cats = {};
  predictions.forEach(p => {
    const c = p.category || 'General';
    if (!cats[c]) cats[c] = { count: 0, total: 0, month: 0, year: 0 };
    cats[c].count++;
    cats[c].total += (p.week_val || 0);
    cats[c].month += (p.month_val || 0);
    cats[c].year += (p.year_val || 0);
  });

  const html = Object.entries(cats).map(([name, data]) => {
    const avgW = data.total / data.count;
    const avgM = data.month / data.count;
    const icon = name.toLowerCase().includes('comm') ? '🏢' : (name.toLowerCase().includes('ind') ? '🏭' : '🏠');
    
    return `
      <div class="cat-card">
        <div class="cat-header">
          <div class="cat-icon">${icon}</div>
          <div class="cat-name">${name}</div>
          <div class="cat-count">${data.count} Predictions</div>
        </div>
        <div class="cat-metrics">
          <div class="cat-metric">
            <span class="cat-metric-val">${formatNumber(avgW)}</span>
            <span class="cat-metric-label">Avg Weekly (kWh)</span>
          </div>
          <div class="cat-metric">
            <span class="cat-metric-val">${formatNumber(avgM)}</span>
            <span class="cat-metric-label">Avg Monthly (kWh)</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html || '<p style="text-align:center; color:var(--text-muted); padding:20px;">No category data found</p>';
}

// ── LIFECYCLE ─────────────────────────────────────────────────

async function refreshStats() {
  try {
    const res = await fetch('/api/predictions');
    const data = await res.json();
    if (data.success) {
      allPredictions = data.predictions;
      
      updateStatsSummary(allPredictions);
      initTrendChart(allPredictions);
      initDonutChart(allPredictions);
      initCityChart(allPredictions);
      renderCategoryBreakdown(allPredictions);
      renderTable(allPredictions, currentPage);
      
      // Update empty state
      const empty = document.getElementById('emptyState');
      if (empty) empty.style.display = allPredictions.length ? 'none' : 'block';
    }
  } catch (err) {
    console.error("Failed to load statistics:", err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  refreshStats();
  
  // Refresh button
  document.getElementById('refreshStatsBtn')?.addEventListener('click', () => {
    refreshStats();
  });

  // Pagination
  document.getElementById('prevPage')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable(allPredictions, currentPage);
    }
  });

  document.getElementById('nextPage')?.addEventListener('click', () => {
    if (currentPage * itemsPerPage < allPredictions.length) {
      currentPage++;
      renderTable(allPredictions, currentPage);
    }
  });

  // Chart Tabs
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      updateTrendMetric(tab.dataset.metric);
    });
  });
});
