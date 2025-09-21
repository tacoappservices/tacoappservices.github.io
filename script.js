// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Use Marked.js when available for robust markdown rendering
function markdownToHtml(markdown) {
  if (window.marked && typeof window.marked.parse === 'function') {
    const raw = window.marked.parse(markdown);
    if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
      return window.DOMPurify.sanitize(raw);
    }
    return raw;
  }
  // Fallback (very basic)
  const raw = `<pre>${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
  if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
    return window.DOMPurify.sanitize(raw);
  }
  return raw;
}

// Mapping of dialog IDs to markdown file paths
const legalMarkdownPaths = {
  'politica_privacidad': 'assets/documents/politica_privacidad.md',
  'aviso_legal': 'assets/documents/aviso_legal.md',
  'condiciones_contratacion': 'assets/documents/condiciones_contratacion.md'
};

// Legal dialogs
const openers = document.querySelectorAll('[data-open]');
openers.forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-open');
    const dlg = document.getElementById(id);
    if (!dlg) return;

    // Load document content from markdown if it's a legal document
    if (id.startsWith('legal-')) {
      const docType = id.replace('legal-', '');
      const path = legalMarkdownPaths[docType];
      if (path) {
        const contentSection = dlg.querySelector('.legal-content section');
        if (contentSection) {
          fetch(path)
            .then(r => r.ok ? r.text() : Promise.reject(new Error(r.status)))
            .then(md => { contentSection.innerHTML = markdownToHtml(md); })
            .catch(() => { contentSection.innerHTML = '<p>No se pudo cargar el documento.</p>'; });
        }
      }
    }

    if (typeof dlg.showModal === 'function') {
      dlg.showModal();
    } else {
      // Fallback: open as new page anchor
      location.hash = '#' + id;
    }
  });
});

// Close on backdrop click
document.querySelectorAll('dialog').forEach((dlg) => {
  dlg.addEventListener('click', (e) => {
    const rect = dlg.getBoundingClientRect();
    const inDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!inDialog) dlg.close();
  });
});

// FAQ search: filter questions by query
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('faq-search-input');
  const items = Array.from(document.querySelectorAll('.qa'));
  const chips = Array.from(document.querySelectorAll('.filter-chip'));
  if (!input && chips.length === 0) return;

  const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  let activeCategory = 'all';

  const applyFilters = () => {
    const q = normalize(input ? input.value.trim() : '');
    items.forEach((el) => {
      const textMatch = !q || normalize(el.textContent).includes(q);
      const catMatch = activeCategory === 'all' || el.classList.contains(`qa--${activeCategory}`);
      if (textMatch && catMatch) el.classList.remove('hidden'); else el.classList.add('hidden');
    });
  };

  if (input) input.addEventListener('input', applyFilters);

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      activeCategory = chip.dataset.filter || 'all';
      applyFilters();
    });
  });

  applyFilters();
});

// FAQ Search functionality
// (removed duplicate DOMContentLoaded FAQ search listener)

// Floating CTA & Back-to-Top logic
document.addEventListener('DOMContentLoaded', () => {
  const floatCta = document.getElementById('floatCta');
  const backToTop = document.getElementById('backToTop');
  const hero = document.querySelector('.hero');

  const toggleVisibility = () => {
    const scrolled = window.scrollY || document.documentElement.scrollTop;
    const threshold = (hero ? hero.offsetHeight : 460) * 0.5; // mitad del hero como umbral
    const show = scrolled > threshold;
    if (floatCta) floatCta.classList.toggle('show', show);
    if (backToTop) backToTop.classList.toggle('show', show);
  };

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  window.addEventListener('resize', toggleVisibility);
  toggleVisibility();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    // return focus to the toggle for accessibility
    toggle.focus({ preventScroll: true });
  };
  const open = () => {
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    // focus first focusable element in nav if available
    const first = nav.querySelector('a,button,input,select,textarea');
    if (first) first.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.contains('open');
    (isOpen ? close : open)();
  });

  // Close on nav link click
  nav.querySelectorAll('a,button').forEach((el) => {
    el.addEventListener('click', close);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('open')) return;
    const withinNav = nav.contains(e.target) || toggle.contains(e.target);
    if (!withinNav) close();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      e.preventDefault();
      close();
    }
  });
});

// Render testimonials from static JSON
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('testimonialsList');
  if (!container) return;
  fetch('assets/testimonials.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    .then((items) => {
      container.innerHTML = items.map((t) => {
        const rating = Math.max(0, Math.min(5, Number(t.rating) || 0));
        const full = '<i class="bi bi-star-fill" aria-hidden="true"></i>'.repeat(rating);
        const empty = '<i class="bi bi-star" aria-hidden="true"></i>'.repeat(5 - rating);
        const isApple = t.source === 'app-store';
        const sourceLabel = isApple ? 'App Store' : 'Google Play';
        const sourceIcon = isApple ? 'bi-apple' : 'bi-google-play';
        const sourceClass = isApple ? 'source--apple' : 'source--google';
        const aria = `Valoración: ${rating} de 5`;
        const author = t.author ? `${t.author}` : 'Usuario';
        const role = t.role ? `, ${t.role}` : '';
        return `
          <blockquote class="card testimonial">
            <div class="testimonial__meta">
              <div class="stars" aria-label="${aria}">${full}${empty}</div>
              <span class="source-badge ${sourceClass}"><i class="bi ${sourceIcon}" aria-hidden="true"></i> ${sourceLabel}</span>
            </div>
            <p>“${t.text}”</p>
            <footer>— ${author}${role}</footer>
          </blockquote>
        `;
      }).join('');
    })
    .catch(() => {
      container.innerHTML = '<p class="muted">No se pudieron cargar los testimonios en este momento.</p>';
    });
});

// Render updates (Novedades) from static JSON
document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('novedades');
  const list = document.getElementById('updatesList');
  if (!section || !list) return;

  fetch('assets/updates.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    .then((items) => {
      if (!Array.isArray(items) || items.length === 0) {
        section.hidden = true;
        return;
      }
      list.innerHTML = items.map((u) => {
        const date = (u.date || '').replaceAll('-', ' / ');
        const version = u.version || '';
        const text = (u.text || '').replace(/[<>]/g, '');
        return `
          <li class="update-item">
            <div class="update-meta">${date} · ${version}</div>
            <p>${text}</p>
          </li>
        `;
      }).join('');
      section.hidden = false;
    })
    .catch(() => {
      section.hidden = true;
    });
});