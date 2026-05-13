// Auth.js - Unified Authentication & UI Bridge for FLUX
class AuthManager {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
  }

  // Common utilities
  validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  validatePassword(password) { return password.length >= 6; }
  isLoggedIn() { return this.currentUser !== null; }
  getCurrentUser() { return this.currentUser; }
  isAdmin() { return this.currentUser && this.currentUser.isAdmin; }

  logout() {
    localStorage.removeItem("currentUser");
    this.currentUser = null;
    window.location.href = "/auth/logout";
  }
}

const auth = new AuthManager();

// ── GLOBAL UI UPDATER ───────────────────────────────────────────
function updateGlobalAuthUI() {
  const user = auth.getCurrentUser() || window.currentUser;
  const els = {
    userEmail: document.getElementById("userEmailIndicator"), // No longer overwriting the trigger element
    userFirstName: document.getElementById("userFirstName"),
    authBtn: document.getElementById("authBtn"),
    logoutBtnHeader: document.getElementById("logoutBtnHeader"),
    logoutBtn: document.getElementById("logoutBtn"),
    adminLink: document.getElementById("adminLink"),
    adminSide: document.getElementById("adminSidebarItem"),
    userTrigger: document.getElementById("userProfileTrigger"),
    userName: document.getElementById("headerUserName"),
    headerAv: document.getElementById("headerAvatar"),
    popupAv: document.getElementById("popupAvatar"),
    footerAv: document.getElementById("footerAvatar"),
    footerWrap: document.getElementById("footerUserWrap"),
    footerName: document.getElementById("footerUserName"),
    pName: document.getElementById("profileName"),
    pEmail: document.getElementById("profileEmail"),
    pOrg: document.getElementById("profileOrg"),
    pCity: document.getElementById("profileCity"),
    pRole: document.getElementById("profileRole")
  };

  if (user) {
    const firstName = user.fullname ? user.fullname.split(" ")[0] : "User";
    const isAdmin = user.isAdmin || user.is_admin === 1 || user.is_admin === true;
    const picBase = user.profile_pic || "/static/images/default-avatar.png";
    // Cache-bust only user-uploaded pics so the browser re-fetches after upload
    const av = user._picTs ? `${picBase}?t=${user._picTs}` : picBase;
    
    if (els.userFirstName) els.userFirstName.textContent = firstName;
    // Don't overwrite trigger content with raw email
    if (els.userName) els.userName.textContent = firstName;
    
    if (els.authBtn) els.authBtn.style.display = "none";
    if (els.logoutBtnHeader) els.logoutBtnHeader.style.display = "block";
    if (els.logoutBtn) els.logoutBtn.style.display = "block";
    if (els.userTrigger) els.userTrigger.style.display = "flex";

    if (isAdmin) {
      if (els.adminLink) els.adminLink.style.display = "block";
      if (els.adminSide) els.adminSide.style.display = "block";
    }

    // Profile Popup & Avatars
    if (els.pName) els.pName.textContent = user.fullname || "User";
    if (els.pEmail) els.pEmail.textContent = user.email || "—";
    if (els.pOrg) els.pOrg.textContent = user.organization || "—";
    if (els.pCity) els.pCity.textContent = user.city || "—";
    if (els.pRole) els.pRole.textContent = isAdmin ? "Administrator" : "User";

    if (els.headerAv) els.headerAv.src = av;
    if (els.popupAv) els.popupAv.src = av;
    if (els.footerAv) els.footerAv.src = av;
    if (els.footerWrap) els.footerWrap.style.display = "flex";
    if (els.footerName) els.footerName.textContent = user.fullname || user.email;

  } else {
    if (els.authBtn) els.authBtn.style.display = "block";
    if (els.logoutBtnHeader) els.logoutBtnHeader.style.display = "none";
    if (els.logoutBtn) els.logoutBtn.style.display = "none";
    if (els.adminLink) els.adminLink.style.display = "none";
    if (els.adminSide) els.adminSide.style.display = "none";
    if (els.userTrigger) els.userTrigger.style.display = "none";
    if (els.footerWrap) els.footerWrap.style.display = "none";
  }

  setupProfilePopup();
}

function setupProfilePopup() {
  const trigger = document.getElementById("userProfileTrigger");
  const popup = document.getElementById("profilePopup");
  const closeBtn = document.querySelector(".close-popup");

  if (!popup || !trigger) return;

  // Cleanup old listeners to prevent leaks
  const newTrigger = trigger.cloneNode(true);
  trigger.parentNode.replaceChild(newTrigger, trigger);

  newTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = window.getComputedStyle(popup).display === "none";
    popup.style.display = isHidden ? "block" : "none";
  });

  if (closeBtn) {
    closeBtn.onclick = () => popup.style.display = "none";
  }

  document.onclick = (e) => {
    if (popup.style.display === "block" && !popup.contains(e.target) && !newTrigger.contains(e.target)) {
      popup.style.display = "none";
    }
  };

  // Avatar Upload
  const upload = document.getElementById("avatarUpload");
  if (upload) {
    upload.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/profile/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          const ts = Date.now();
          if (window.currentUser) {
            window.currentUser.profile_pic = data.profile_pic;
            window.currentUser._picTs = ts;
          }
          auth.currentUser.profile_pic = data.profile_pic;
          auth.currentUser._picTs = ts;
          localStorage.setItem("currentUser", JSON.stringify(auth.currentUser));
          updateGlobalAuthUI();
          // Show feedback
          const popupAv = document.getElementById("popupAvatar");
          if (popupAv) popupAv.style.outline = "3px solid #00d084";
          setTimeout(() => { if (popupAv) popupAv.style.outline = ""; }, 2000);
        } else {
          console.error("Upload error:", data.error);
        }
      } catch (err) { console.error("Upload failed", err); }
    };
  }
}

// ── GLOBAL ALERT ───────────────────────────────────────────────
function showAlert(message, type = "info") {
  const container = document.getElementById("alertContainer") || document.getElementById("predAlertContainer");
  if (!container) {
    console.warn("No alert container found:", message);
    return;
  }

  const alert = document.createElement("div");
  alert.className = `alert alert-${type} pred-alert pred-alert-${type}`;
  alert.textContent = message;

  container.innerHTML = "";
  container.appendChild(alert);

  setTimeout(() => alert.classList.add('fade-out'), 4500);
  setTimeout(() => alert.remove(), 5000);
}

// ── INIT ────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  updateGlobalAuthUI();

  // Sync across tabs: if user updates profile in another tab, refresh UI here
  window.addEventListener("storage", (e) => {
    if (e.key === "currentUser") {
      try {
        const newData = JSON.parse(e.newValue);
        auth.currentUser = newData;
        if (window.currentUser) window.currentUser = auth.currentUser;
        updateGlobalAuthUI();
      } catch (_) {}
    }
  });

  // Handle Logout Buttons
  const logoutBtns = ["logoutBtn", "logoutBtnHeader", "profileLogoutBtn"];
  logoutBtns.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        auth.logout();
      });
    }
  });

  // Handle Login/Signup Forms if present
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.onsubmit = (e) => {
      const email = document.getElementById("email").value.trim();
      const pass = document.getElementById("password").value;
      if (!auth.validateEmail(email) || !pass) {
        e.preventDefault();
        showAlert("Please enter a valid email and password.", "error");
      }
    };
  }

  if (signupForm) {
    signupForm.onsubmit = (e) => {
      const pass = document.getElementById("password").value;
      const conf = document.getElementById("confirmPassword").value;
      if (pass !== conf) {
        e.preventDefault();
        showAlert("Passwords do not match.", "error");
      } else if (pass.length < 6) {
        e.preventDefault();
        showAlert("Password must be at least 6 characters.", "error");
      }
    };
  }

  // Redirect checks
  const path = window.location.pathname;
  if (!auth.isLoggedIn() && (path.includes("prediction") || path.includes("statistics"))) {
    window.location.href = "/auth/login";
  }
});
