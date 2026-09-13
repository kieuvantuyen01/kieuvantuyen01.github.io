/**
 * Academic Homepage Interactive Logic
 * Kieu Van Tuyen (Kiều Văn Tuyên) - VNU-UET
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initPublicationFilters();
  initPublicationSearch();
  initNavScrollSpy();
  initMobileMenu();
  initBackToTop();
});

/* --------------------------------------------------------------------------
   Theme Toggle (Dark / Light Mode)
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Check local storage or system preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (prefersDarkScheme.matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('theme', targetTheme);
      showToast(`Switched to ${targetTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
    });
  }
}

/* --------------------------------------------------------------------------
   Publication Filter Tabs
   -------------------------------------------------------------------------- */
let activeFilter = 'all';

function initPublicationFilters() {
  const filterBtns = document.querySelectorAll('.pub-filter-btn');
  const pubCards = document.querySelectorAll('.pub-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      applyPubFilters();
    });
  });
}

/* --------------------------------------------------------------------------
   Publication Search Filter
   -------------------------------------------------------------------------- */
let searchQuery = '';

function initPublicationSearch() {
  const searchInput = document.getElementById('pub-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    applyPubFilters();
  });
}

function applyPubFilters() {
  const pubCards = document.querySelectorAll('.pub-card');
  let visibleCount = 0;

  pubCards.forEach(card => {
    const cardCategory = card.getAttribute('data-category') || '';
    const isSelected = card.getAttribute('data-selected') === 'true';
    const cardText = card.textContent.toLowerCase();

    // Category check
    let categoryMatch = false;
    if (activeFilter === 'all') {
      categoryMatch = true;
    } else if (activeFilter === 'selected') {
      categoryMatch = isSelected;
    } else if (activeFilter === cardCategory) {
      categoryMatch = true;
    }

    // Search query check
    const searchMatch = !searchQuery || cardText.includes(searchQuery);

    if (categoryMatch && searchMatch) {
      card.style.display = 'block';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  const countDisplay = document.getElementById('pub-count-badge');
  if (countDisplay) {
    countDisplay.textContent = `${visibleCount} papers`;
  }
}

/* --------------------------------------------------------------------------
   Toggle Abstract Drawer
   -------------------------------------------------------------------------- */
window.toggleAbstract = function(id) {
  const abstractDrawer = document.getElementById(`abstract-${id}`);
  const bibtexDrawer = document.getElementById(`bibtex-${id}`);
  
  if (bibtexDrawer) bibtexDrawer.classList.remove('active');

  if (abstractDrawer) {
    abstractDrawer.classList.toggle('active');
  }
};

/* --------------------------------------------------------------------------
   Toggle BibTeX Drawer
   -------------------------------------------------------------------------- */
window.toggleBibtex = function(id) {
  const bibtexDrawer = document.getElementById(`bibtex-${id}`);
  const abstractDrawer = document.getElementById(`abstract-${id}`);

  if (abstractDrawer) abstractDrawer.classList.remove('active');

  if (bibtexDrawer) {
    bibtexDrawer.classList.toggle('active');
  }
};

/* --------------------------------------------------------------------------
   Copy BibTeX to Clipboard
   -------------------------------------------------------------------------- */
window.copyBibtex = function(id) {
  const codeEl = document.getElementById(`bibtex-code-${id}`);
  if (!codeEl) return;

  const textToCopy = codeEl.innerText.trim();
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast('BibTeX copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy: ', err);
    showToast('Failed to copy to clipboard');
  });
};

/* --------------------------------------------------------------------------
   Copy Email Helper
   -------------------------------------------------------------------------- */
window.copyEmail = function(email) {
  navigator.clipboard.writeText(email).then(() => {
    showToast(`Copied ${email} to clipboard!`);
  }).catch(() => {
    showToast('Unable to copy email');
  });
};

/* --------------------------------------------------------------------------
   Navigation Scroll Spy
   -------------------------------------------------------------------------- */
function initNavScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   Mobile Menu Toggle
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close when clicking a link
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }
}

/* --------------------------------------------------------------------------
   Back To Top Button
   -------------------------------------------------------------------------- */
function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* --------------------------------------------------------------------------
   Toast Notification Utility
   -------------------------------------------------------------------------- */
function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;

  toast.classList.add('show');

  clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
