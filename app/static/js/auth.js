// Auth.js - Handle login and signup functionality

class AuthManager {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
    this.users = JSON.parse(localStorage.getItem("users")) || [];

    // Ensure at least one admin exists (first user should be admin)
    if (this.users.length > 0 && !this.users.some((u) => u.isAdmin)) {
      this.users[0].isAdmin = true;
      localStorage.setItem("users", JSON.stringify(this.users));
    }
  }

  // Validate email format
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Validate password strength
  validatePassword(password) {
    return password.length >= 6;
  }

  // Login user
  login(email, password) {
    const user = this.users.find(
      (u) => u.email === email && u.password === password,
    );

    if (user) {
      user.lastLogin = new Date().toISOString();

      // Ensure first user is always admin
      if (!this.users.some((u) => u.isAdmin)) {
        user.isAdmin = true;
      }

      localStorage.setItem("users", JSON.stringify(this.users));
      localStorage.setItem("currentUser", JSON.stringify(user));
      this.currentUser = user;
      return { success: true, user };
    }

    return { success: false, message: "Invalid email or password" };
  }

  // Sign up user
  signup(userData) {
    const existingUser = this.users.find((u) => u.email === userData.email);

    if (existingUser) {
      return { success: false, message: "Email already registered" };
    }

    // Make the first user an admin
    const isFirstUser = this.users.length === 0;

    const newUser = {
      id: Date.now(),
      ...userData,
      isAdmin: isFirstUser, // First user is automatically admin
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    this.users.push(newUser);
    localStorage.setItem("users", JSON.stringify(this.users));
    // DO NOT set currentUser on signup - let them login instead
    return { success: true, user: newUser };
  }

  // Logout user
  logout() {
    localStorage.removeItem("currentUser");
    this.currentUser = null;
    window.location.href = "/auth/logout";
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Make user admin
  makeAdmin(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.isAdmin = true;
      localStorage.setItem("users", JSON.stringify(this.users));
      return true;
    }
    return false;
  }

  // Check if current user is admin
  isAdmin() {
    return this.currentUser && this.currentUser.isAdmin;
  }
}

const auth = new AuthManager();

// Handle login form
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Clear previous errors
    document.getElementById("emailError").textContent = "";
    document.getElementById("passwordError").textContent = "";

    let hasError = false;

    // Validation
    if (!email) {
      document.getElementById("emailError").textContent = "Email is required";
      hasError = true;
    } else if (!auth.validateEmail(email)) {
      document.getElementById("emailError").textContent =
        "Please enter a valid email";
      hasError = true;
    }

    if (!password) {
      document.getElementById("passwordError").textContent =
        "Password is required";
      hasError = true;
    }

    if (hasError) return;

    // Submit the form to the backend natively
    document.getElementById("loginForm").submit();
  });
}

// Handle signup form
if (document.getElementById("signupForm")) {
  document
    .getElementById("signupForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const fullname = document.getElementById("fullname").value.trim();
      const email = document.getElementById("email").value.trim();
      const organization = document.getElementById("organization").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const city = document.getElementById("city").value;
      const category = document.getElementById("category").value;
      const terms = document.getElementById("terms").checked;

      // Clear previous errors
      document.getElementById("fullnameError").textContent = "";
      document.getElementById("emailError").textContent = "";
      document.getElementById("organizationError").textContent = "";
      document.getElementById("passwordError").textContent = "";
      document.getElementById("confirmPasswordError").textContent = "";
      document.getElementById("cityError").textContent = "";
      document.getElementById("categoryError").textContent = "";
      document.getElementById("termsError").textContent = "";

      let hasError = false;

      // Validation
      if (!fullname) {
        document.getElementById("fullnameError").textContent =
          "Full name is required";
        hasError = true;
      } else if (fullname.length < 3) {
        document.getElementById("fullnameError").textContent =
          "Name must be at least 3 characters";
        hasError = true;
      }

      if (!email) {
        document.getElementById("emailError").textContent = "Email is required";
        hasError = true;
      } else if (!auth.validateEmail(email)) {
        document.getElementById("emailError").textContent =
          "Please enter a valid email";
        hasError = true;
      }

      if (!organization) {
        document.getElementById("organizationError").textContent =
          "Organization name is required";
        hasError = true;
      }

      if (!password) {
        document.getElementById("passwordError").textContent =
          "Password is required";
        hasError = true;
      } else if (!auth.validatePassword(password)) {
        document.getElementById("passwordError").textContent =
          "Password must be at least 6 characters";
        hasError = true;
      }

      if (!confirmPassword) {
        document.getElementById("confirmPasswordError").textContent =
          "Please confirm your password";
        hasError = true;
      } else if (password !== confirmPassword) {
        document.getElementById("confirmPasswordError").textContent =
          "Passwords do not match";
        hasError = true;
      }

      if (!city) {
        document.getElementById("cityError").textContent =
          "Please select a city";
        hasError = true;
      }

      if (!category) {
        document.getElementById("categoryError").textContent =
          "Please select a category";
        hasError = true;
      }

      if (!terms) {
        document.getElementById("termsError").textContent =
          "You must agree to the terms";
        hasError = true;
      }

      if (hasError) return;

      // Submit the form natively
      document.getElementById("signupForm").submit();
    });
}

// Show alert message
function showAlert(message, type = "info") {
  const container = document.getElementById("alertContainer");
  if (!container) return;

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  container.innerHTML = "";
  container.appendChild(alert);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Redirect to appropriate page if already logged in
window.addEventListener("DOMContentLoaded", function () {
  const currentPage = window.location.pathname;

  // Development bypass: prevent jumping out of admin page automatically
  // Let admin.js auto-provision an admin user.
  if (currentPage.includes("admin.html")) {
    return;
  }

  if (auth.isLoggedIn()) {
    // If on login or signup page, redirect to index.html for all users
    if (
      currentPage.includes("login.html") ||
      currentPage.includes("signup.html")
    ) {
      window.location.href = "/";
    }
  } else {
    // If on protected pages, redirect to login
    if (
      currentPage.includes("prediction.html") ||
      currentPage.includes("statistics.html")
    ) {
      window.location.href = "/auth/login";
    }
  }
});
