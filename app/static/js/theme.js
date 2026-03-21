// Theme.js - Dark/Light Mode Toggle
class ThemeManager {
  constructor() {
    this.htmlElement = document.documentElement;
    this.currentTheme = localStorage.getItem("theme") || "dark";
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.setupToggle();
  }

  applyTheme(theme) {
    if (theme === "light") {
      this.htmlElement.setAttribute("data-theme", "light");
      this.updateLightModeVariables();
    } else {
      this.htmlElement.setAttribute("data-theme", "dark");
      this.updateDarkModeVariables();
    }
    this.currentTheme = theme;
    localStorage.setItem("theme", theme);
    this.updateToggleButton();
  }

  updateDarkModeVariables() {
    const root = this.htmlElement.style;
    root.setProperty("--dark-bg", "#0a0e27");
    root.setProperty("--darker-bg", "#050812");
    root.setProperty("--card-bg", "#1a1f3a");
    root.setProperty("--sidebar-bg", "#121828");
    root.setProperty("--electric", "#00d4ff");
    root.setProperty("--electric-dark", "#0099cc");
    root.setProperty("--accent", "#ff006e");
    root.setProperty("--white", "#ffffff");
    root.setProperty("--text-light", "#e0e0e0");
    root.setProperty("--text-gray", "#a0a0a0");
    root.setProperty("--border", "#2a2f4a");
    root.setProperty("--success", "#00d084");
    root.setProperty("--smoke", "#2a2f4a");
  }

  updateLightModeVariables() {
    const root = this.htmlElement.style;
    root.setProperty("--dark-bg", "#ffffff");
    root.setProperty("--darker-bg", "#f5f5f5");
    root.setProperty("--card-bg", "#f9f9f9");
    root.setProperty("--sidebar-bg", "#f0f0f0");
    root.setProperty("--electric", "#0099cc");
    root.setProperty("--electric-dark", "#007aa3");
    root.setProperty("--accent", "#cc0055");
    root.setProperty("--white", "#ffffff");
    root.setProperty("--text-light", "#333333");
    root.setProperty("--text-gray", "#666666");
    root.setProperty("--border", "#e0e0e0");
    root.setProperty("--success", "#00a366");
    root.setProperty("--smoke", "#eeeeee");
  }

  setupToggle() {
    const toggleBtn = document.getElementById("themeToggle");
    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
      const newTheme = this.currentTheme === "dark" ? "light" : "dark";
      this.applyTheme(newTheme);
    });
  }

  updateToggleButton() {
    const toggleBtn = document.getElementById("themeToggle");
    if (!toggleBtn) return;

    const sunIcon = toggleBtn.querySelector(".sun-icon");
    const moonIcon = toggleBtn.querySelector(".moon-icon");

    if (this.currentTheme === "dark") {
      if (sunIcon) {
        sunIcon.style.display = "block";
        sunIcon.style.opacity = "1";
        sunIcon.style.transform = "rotate(0deg) scale(1)";
      }
      if (moonIcon) {
        moonIcon.style.display = "none";
        moonIcon.style.opacity = "0";
        moonIcon.style.transform = "rotate(90deg) scale(0.8)";
      }
      toggleBtn.title = "Switch to Light Mode";
    } else {
      if (sunIcon) {
        sunIcon.style.display = "none";
        sunIcon.style.opacity = "0";
        sunIcon.style.transform = "rotate(-90deg) scale(0.8)";
      }
      if (moonIcon) {
        moonIcon.style.display = "block";
        moonIcon.style.opacity = "1";
        moonIcon.style.transform = "rotate(0deg) scale(1)";
      }
      toggleBtn.title = "Switch to Dark Mode";
    }
  }

  toggle() {
    const newTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(newTheme);
  }
}

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.themeManager = new ThemeManager();
  });
} else {
  window.themeManager = new ThemeManager();
}
