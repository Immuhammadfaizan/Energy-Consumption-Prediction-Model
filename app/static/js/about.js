// About.js - Handle about page functionality

// Initialize on page load
window.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
});

// Update authentication UI
function updateAuthUI() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userEmailSpan = document.getElementById('userEmail');
    const authBtn = document.getElementById('authBtn');
    const logoutBtnHeader = document.getElementById('logoutBtnHeader');
    const logoutBtn = document.getElementById('logoutBtn');
    // const adminBtn = document.getElementById('adminBtn');
    const adminLink = document.getElementById('adminLink');

    if (currentUser) {
        const firstName = currentUser.fullname ? currentUser.fullname.split(' ')[0] : currentUser.email;
        const userFirstNameSpan = document.getElementById('userFirstName');
        if (userFirstNameSpan) {
            userFirstNameSpan.textContent = firstName;
            userFirstNameSpan.parentElement && userFirstNameSpan.parentElement.classList.add('pulse');
            setTimeout(() => userFirstNameSpan.parentElement && userFirstNameSpan.parentElement.classList.remove('pulse'), 900);
        } else if (userEmailSpan) {
            userEmailSpan.textContent = firstName;
        }
        if (authBtn) authBtn.style.display = 'none';
        if (logoutBtnHeader) logoutBtnHeader.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';

        if (currentUser.isAdmin) {
            // if (adminBtn) adminBtn.style.display = 'block';
            if (adminLink) adminLink.style.display = 'block';
        }
    } else {
        const userFirstNameSpan = document.getElementById('userFirstName');
        if (userFirstNameSpan) userFirstNameSpan.textContent = '';
        else if (userEmailSpan) userEmailSpan.textContent = '';
        if (authBtn) authBtn.style.display = 'block';
        if (logoutBtnHeader) logoutBtnHeader.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        // if (adminBtn) adminBtn.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }

    // Setup logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    if (logoutBtnHeader) {
        logoutBtnHeader.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

function logout() {
  window.location.href = "/auth/logout";
}
