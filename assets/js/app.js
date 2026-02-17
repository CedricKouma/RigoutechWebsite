/**
 * Main Application - Core functionality
 * Navigation, scrolling, DOM manipulation
 */

'use strict';

// DOM utility functions
const DOM = {
  select: (selector, all = false) => {
    const result = all
      ? document.querySelectorAll(selector)
      : document.querySelector(selector);
    return all && result ? Array.from(result) : result;
  },

  on: (element, event, listener, options = false) => {
    if (!element) return;
    element.addEventListener(event, listener, options);
  },

  onAll: (selector, event, listener, options = false) => {
    const elements = DOM.select(selector, true);
    if (elements.length) {
      elements.forEach(el => DOM.on(el, event, listener, options));
    }
  },

  addClass: (element, className) => {
    if (element) element.classList.add(className);
  },

  removeClass: (element, className) => {
    if (element) element.classList.remove(className);
  },

  toggleClass: (element, className) => {
    if (element) element.classList.toggle(className);
  },

  hasClass: (element, className) => {
    return element ? element.classList.contains(className) : false;
  },
};

// Scroll utilities
const Scroll = {
  getScrollPosition: () => window.scrollY || document.documentElement.scrollTop,

  smoothScroll: (target, offset = 0) => {
    if (!target) return;
    const elementPosition = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: elementPosition - offset,
      behavior: 'smooth',
    });
  },

  addListener: (callback) => {
    window.addEventListener('scroll', callback, { passive: true });
  },

  getElementOffset: (element) => {
    if (!element) return 0;
    return element.getBoundingClientRect().top + window.scrollY;
  },
};

// Navigation Management
class Navigation {
  constructor() {
    this.navbar = DOM.select('#navbar');
    this.navToggle = DOM.select('.rt-nav__toggle');
    this.navMenu = DOM.select('.rt-nav__menu');
    this.scrollLinks = DOM.select('.rt-scrollto', true);
    this.header = DOM.select('#header');
    this.firstNavLink = null;

    this.init();
  }

  init() {
    this.setupMobileToggle();
    this.setupScrollLinks();
    this.setupActiveLink();
    this.setupHeaderFixed();
  }

  setupMobileToggle() {
    this.firstNavLink = this.navMenu ? this.navMenu.querySelector('.rt-nav__link') : null;
    DOM.on(this.navToggle, 'click', () => this.toggleMobileMenu());
    
    // Close menu when clicking outside
    DOM.on(document, 'click', (e) => {
      const isToggle = e.target.closest('.rt-nav__toggle');
      const isMenu = e.target.closest('.rt-nav__menu');
      
      if (!isToggle && !isMenu && DOM.hasClass(this.navMenu, 'active')) {
        this.closeMobileMenu();
      }
    });

    DOM.on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && DOM.hasClass(this.navMenu, 'active')) {
        this.closeMobileMenu();
        if (this.navToggle) this.navToggle.focus();
      }
    });

    // Close mobile menu on any navigation link click
    DOM.onAll('.rt-nav__link', 'click', () => {
      if (DOM.hasClass(this.navMenu, 'active')) {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    if (!this.navMenu) return;

    const isOpen = DOM.hasClass(this.navMenu, 'active');
    if (isOpen) {
      this.closeMobileMenu();
    } else {
      DOM.addClass(this.navMenu, 'active');
      if (this.navToggle) this.navToggle.setAttribute('aria-expanded', 'true');
      if (this.navToggle) this.navToggle.setAttribute('aria-label', 'Fermer le menu mobile');
      document.body.classList.add('rt-no-scroll');
      if (this.firstNavLink) this.firstNavLink.focus();
    }
  }

  closeMobileMenu() {
    DOM.removeClass(this.navMenu, 'active');
    if (this.navToggle) this.navToggle.setAttribute('aria-expanded', 'false');
    if (this.navToggle) this.navToggle.setAttribute('aria-label', 'Ouvrir le menu mobile');
    document.body.classList.remove('rt-no-scroll');
  }

  setupScrollLinks() {
    DOM.onAll('.rt-scrollto', 'click', (e) => {
      const href = e.currentTarget.getAttribute('href');
      if (!href.startsWith('#')) return;

      e.preventDefault();

      const target = DOM.select(href);
      if (!target) return;

      // Close mobile menu
      this.closeMobileMenu();

      // Calculate offset
      const offset = this.header ? this.header.offsetHeight : 0;

      // Scroll to target
      Scroll.smoothScroll(target, offset);

      // Update active link
      this.updateActiveLink();
    });
  }

  setupActiveLink() {
    Scroll.addListener(() => this.updateActiveLink());
  }

  updateActiveLink() {
    const scrollPosition = Scroll.getScrollPosition() + 200;

    this.scrollLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href.startsWith('#')) return;

      const section = DOM.select(href);
      if (!section) return;

      const sectionTop = Scroll.getElementOffset(section);
      const sectionBottom = sectionTop + section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        // Remove active from all
        this.scrollLinks.forEach(l => DOM.removeClass(l, 'rt-nav__link--active'));
        // Add to current
        DOM.addClass(link, 'rt-nav__link--active');
      }
    });
  }

  setupHeaderFixed() {
    const headerOffset = Scroll.getElementOffset(this.header);

    Scroll.addListener(() => {
      if (Scroll.getScrollPosition() >= headerOffset) {
        DOM.addClass(this.header, 'rt-header--scrolled');
      } else {
        DOM.removeClass(this.header, 'rt-header--scrolled');
      }
    });
  }
}

// Back to Top Button
class BackToTop {
  constructor() {
    this.button = DOM.select('.rt-back-to-top');
    this.threshold = 100;

    if (this.button) {
      this.init();
    }
  }

  init() {
    DOM.on(this.button, 'click', (e) => {
      e.preventDefault();
      Scroll.smoothScroll(document.documentElement, 0);
    });

    Scroll.addListener(() => this.toggle());
  }

  toggle() {
    if (Scroll.getScrollPosition() > this.threshold) {
      DOM.addClass(this.button, 'active');
    } else {
      DOM.removeClass(this.button, 'active');
    }
  }
}

// Preloader
class Preloader {
  constructor() {
    this.preloader = DOM.select('#preloader');
    this.init();
  }

  init() {
    if (this.preloader) {
      window.addEventListener('load', () => {
        this.preloader.style.display = 'none';
        setTimeout(() => {
          this.preloader.remove();
        }, 500);
      });
    }
  }
}

// Mailto Forms
class MailtoForms {
  constructor() {
    this.forms = DOM.select('[data-mailto-form]', true);
    this.targetEmail = 'info@rigoutech.com';
    this.init();
  }

  init() {
    if (!this.forms.length) return;
    this.forms.forEach((form) => {
      DOM.on(form, 'submit', (e) => this.handleSubmit(e, form));
    });
  }

  handleSubmit(event, form) {
    event.preventDefault();

    const feedback = form.querySelector('.rt-form__feedback');
    const honeypot = form.querySelector('.rt-honeypot');
    if (honeypot && honeypot.value.trim() !== '') {
      if (feedback) feedback.textContent = 'Soumission bloquée.';
      return;
    }

    if (!form.checkValidity()) {
      if (feedback) feedback.textContent = 'Merci de compléter tous les champs requis.';
      form.reportValidity();
      return;
    }

    const subject = form.getAttribute('data-subject') || 'Nouveau message - Rigoutech';
    const data = new FormData(form);
    const lines = [];

    data.forEach((value, key) => {
      if (!value || key === 'site_web') return;
      const label = key.replaceAll('_', ' ');
      lines.push(`${label}: ${String(value).trim()}`);
    });

    const body = lines.join('\n');
    const mailto = `mailto:${this.targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;

    if (feedback) {
      feedback.textContent = 'Votre client email va s’ouvrir. Si rien ne se passe, contactez info@rigoutech.com.';
    }

    form.reset();
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  new Navigation();
  new BackToTop();
  new Preloader();
  new MailtoForms();

  // Initialize AOS if available
  if (typeof AOS !== 'undefined') {
    setTimeout(() => {
      AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
        mirror: false,
      });
    }, 100);
  }

  // Set current year in footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
});
