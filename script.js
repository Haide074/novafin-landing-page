/* ============================================================
   NovaFin — main.js
   Interactions: header scroll, mobile menu, reveal animations,
   FAQ accordion, counter animation, form handling
   ============================================================ */

(function () {
  'use strict';

  /* ─── Mark JS as ready (gates CSS animations so content is never invisible) */
  document.body.classList.add('js-ready');

  /* ─── Header scroll ─────────────────────────────────────── */
  const header = document.getElementById('site-header');
  let lastScroll = 0;


  function onScroll() {
    const y = window.scrollY;
    if (y > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─── Mobile menu toggle ────────────────────────────────── */
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu   = document.getElementById('mobile-menu');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function () {
      const isOpen = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!isOpen));
      mobileMenu.setAttribute('aria-hidden', String(isOpen));
    });

    // Close on nav link click
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ─── Scroll reveal (IntersectionObserver) ──────────────── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  function revealAll() {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  // Immediately reveal everything already visible on page load
  function revealVisible() {
    revealEls.forEach(function (el) {
      if (isInViewport(el)) el.classList.add('is-visible');
    });
  }

  if ('IntersectionObserver' in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 0px 0px' }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealAll();
  }

  // Run immediately and after short delay (catches paint timing edge-cases)
  revealVisible();
  setTimeout(revealVisible, 100);
  // Hard fallback: reveal everything after 500ms no matter what
  setTimeout(revealAll, 500);

  /* ─── Counter animation ─────────────────────────────────── */
  const counters = document.querySelectorAll('.js-counter');

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const duration = 1800;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(update);
  }

  if ('IntersectionObserver' in window && counters.length) {
    const counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { counterObserver.observe(el); });
  }

  /* ─── FAQ Accordion ─────────────────────────────────────── */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const isOpen = item.classList.contains('is-open');

      // Close all others
      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        const otherBtn = other.querySelector('.faq-q');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ─── Smooth scroll for anchor links ────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      const top = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ─── Active nav link on scroll ─────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.header-nav a');

  function updateActiveNav() {
    const scrollPos = window.scrollY + (header ? header.offsetHeight : 80) + 40;
    let currentId = '';

    sections.forEach(function (section) {
      if (section.offsetTop <= scrollPos) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === '#' + currentId) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ─── Lead form submission ──────────────────────────────── */
  const form        = document.getElementById('consultation-form');
  const formSuccess = document.getElementById('form-success');
  const formContainer = document.getElementById('form-container');

  if (form && formSuccess) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Simple validation
      const requiredFields = form.querySelectorAll('[required]');
      let valid = true;

      requiredFields.forEach(function (field) {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#e53e3e';
          valid = false;
        }
        if (field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          field.style.borderColor = '#e53e3e';
          valid = false;
        }
      });

      if (!valid) return;

      // Show success state
      formContainer.style.display = 'none';
      formSuccess.classList.add('is-visible');

      // Analytics tracking (if GA is present)
      if (typeof gtag === 'function') {
        gtag('event', 'form_submission', {
          event_category: 'Lead',
          event_label: 'Free Review Form'
        });
      }
    });

    // Clear validation styling on input
    form.querySelectorAll('input, select').forEach(function (field) {
      field.addEventListener('input', function () {
        this.style.borderColor = '';
      });
    });
  }

  /* ─── Header nav active styles (CSS helper) ─────────────── */
  const style = document.createElement('style');
  style.textContent = '.header-nav a.active { color: var(--gold); }';
  document.head.appendChild(style);

  /* ─── WhatsApp floating button (optional) ───────────────── */
  // Floating WA button on mobile
  const waBtn = document.createElement('a');
  waBtn.href = 'https://wa.me/971559941824';
  waBtn.setAttribute('target', '_blank');
  waBtn.setAttribute('rel', 'noopener noreferrer');
  waBtn.setAttribute('aria-label', 'Chat on WhatsApp');
  waBtn.setAttribute('id', 'floating-wa');
  waBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  const waStyle = document.createElement('style');
  waStyle.textContent = `
    #floating-wa {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #25D366;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(37,211,102,.45);
      z-index: 999;
      transition: transform 0.22s ease, box-shadow 0.22s ease;
    }
    #floating-wa:hover {
      transform: scale(1.10);
      box-shadow: 0 8px 28px rgba(37,211,102,.55);
    }
  `;

  document.head.appendChild(waStyle);
  document.body.appendChild(waBtn);

  /* ─── Stagger service card reveals ──────────────────────── */
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(function (card, i) {
    card.style.transitionDelay = (i % 4 * 0.08) + 's';
  });

  /* ─── Stagger tile reveals ───────────────────────────────── */
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(function (tile, i) {
    tile.style.transitionDelay = (i % 3 * 0.1) + 's';
  });

})();
