// Sidebar.js - Handle sidebar open/close functionality

class Sidebar {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.overlay = document.querySelector('.sidebar-overlay');
        this.menuToggle = document.querySelector('.menu-toggle');
        this.menuLinks = document.querySelectorAll('.sidebar-menu a');
        
        this.init();
    }

    init() {
        if (!this.menuToggle) return;

        // Toggle sidebar when menu button is clicked
        this.menuToggle.addEventListener('click', () => this.toggleSidebar());

        // Close sidebar when overlay is clicked
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeSidebar());
        }

        // Close sidebar when a menu link is clicked
        this.menuLinks.forEach(link => {
            link.addEventListener('click', () => this.closeSidebar());
        });

        // Close sidebar when Escape key is pressed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
            }
        });

        // Update active link based on current page
        this.updateActiveLink();
    }

    toggleSidebar() {
        if (this.sidebar && this.sidebar.classList.contains('active')) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.add('active');
        }
        if (this.overlay) {
            this.overlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.remove('active');
        }
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
        document.body.style.overflow = 'auto';
    }

    updateActiveLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        this.menuLinks.forEach(link => {
            const href = link.getAttribute('href').split('/').pop();
            if (href === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Sidebar();
    });
} else {
    new Sidebar();
}
