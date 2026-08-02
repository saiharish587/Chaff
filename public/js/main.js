// Local-only landing page script (Firestore removed)

// Make functions globally available by attaching to window
window.setActive = function (role) {
  window.currentRole = role;
  const manufacturerBtn = document.getElementById('manufacturerButton');
  const farmerBtn = document.getElementById('farmerButton');

  if (manufacturerBtn && farmerBtn) {
    manufacturerBtn.classList.toggle('active', role === 'manufacturer');
    farmerBtn.classList.toggle('active', role === 'farmer');
  }

  const currentRoleElement = document.getElementById('currentRole');
  if (currentRoleElement) {
    currentRoleElement.textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} Login`;
  }

  openAuthModal();
};

window.openAuthModal = function () {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'block';
};

window.closeAuthModal = function () {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'none';
};

window.initAuthModal = function () {
  window.onclick = function (event) {
    const modal = document.getElementById('authModal');
    if (event.target === modal) {
      window.closeAuthModal();
    }
  };

  const closeBtn = document.querySelector('.close-modal');
  if (closeBtn) closeBtn.onclick = window.closeAuthModal;
};

document.addEventListener('DOMContentLoaded', function () {
  initSlideshow();
  initSmoothScroll();
  initNavbarScroll();
  window.initAuthModal();

  // Local-only contact form behavior
  const contactForm = document.querySelector('.newsletter-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      alert('Thanks! In local-only mode, your message is not sent to a server.');
      contactForm.reset();
    });
  }
});

function initSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelector('.slide-indicators');
  if (!slides.length || !indicators) return;

  let current = 0;

  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.classList.add('slide-indicator');
    dot.addEventListener('click', () => go(idx));
    indicators.appendChild(dot);
  });

  function go(idx) {
    slides[current].classList.remove('active');
    indicators.children[current].classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    indicators.children[current].classList.add('active');
  }

  slides[0].classList.add('active');
  indicators.children[0].classList.add('active');

  const prev = document.querySelector('.prev-slide');
  const next = document.querySelector('.next-slide');
  if (prev) prev.addEventListener('click', () => go(current - 1));
  if (next) next.addEventListener('click', () => go(current + 1));

  setInterval(() => go(current + 1), 2500);
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    });
  });
}

function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 100) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    navbar.style.transform = currentScroll > lastScroll ? 'translateY(-100%)' : 'translateY(0)';
    lastScroll = currentScroll;
  });
}
