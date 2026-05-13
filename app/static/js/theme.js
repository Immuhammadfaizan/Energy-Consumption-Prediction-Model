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
    this.htmlElement.setAttribute("data-theme", theme);
    this.currentTheme = theme;
    localStorage.setItem("theme", theme);
    this.updateToggleButton();
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
      if (sunIcon) sunIcon.style.display = "block";
      if (moonIcon) moonIcon.style.display = "none";
      toggleBtn.title = "Switch to Light Mode";
    } else {
      if (sunIcon) sunIcon.style.display = "none";
      if (moonIcon) moonIcon.style.display = "block";
      toggleBtn.title = "Switch to Dark Mode";
    }
  }

  toggle() {
    this.applyTheme(this.currentTheme === "dark" ? "light" : "dark");
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
