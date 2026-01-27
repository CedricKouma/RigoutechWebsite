/**
 * Theme Management - Dark/Light mode toggle
 * Persistent theme preference
 */

'use strict';

class ThemeManager {
  constructor() {
    this.root = document.documentElement;
    this.toggle = document.getElementById('themeToggle');
    this.icon = document.getElementById('themeIcon');
    this.storageKey = 'rt-theme';
    this.darkClass = 'dark';

    if (this.toggle) {
      this.init();
    }
  }

  init() {
    // Set initial theme
    this.loadTheme();

    // Listen for toggle
    this.toggle.addEventListener('click', () => this.toggleTheme());

    // Listen for system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.storageKey)) {
          this.applyTheme(e.matches ? this.darkClass : 'light');
        }
      });
    }

    // Setup accessibility
    this.updateAriaPressed();
  }

  loadTheme() {
    // Check localStorage first
    const stored = localStorage.getItem(this.storageKey);
    
    if (stored) {
      this.applyTheme(stored);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme(prefersDark ? this.darkClass : 'light');
    }
  }

  applyTheme(theme) {
    const isDark = theme === this.darkClass;

    if (isDark) {
      this.root.setAttribute('data-theme', this.darkClass);
      this.icon.className = 'bi bi-sun';
    } else {
      this.root.setAttribute('data-theme', 'light');
      this.icon.className = 'bi bi-moon-stars';
    }

    this.updateAriaPressed();
  }

  toggleTheme() {
    const current = this.root.getAttribute('data-theme') || 'light';
    const next = current === this.darkClass ? 'light' : this.darkClass;

    this.applyTheme(next);
    localStorage.setItem(this.storageKey, next);
  }

  updateAriaPressed() {
    const isDark = this.root.getAttribute('data-theme') === this.darkClass;
    this.toggle.setAttribute('aria-pressed', isDark.toString());
  }
}

// Initialize theme manager
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});
