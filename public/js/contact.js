// Local-only mode: contact form does not call backend

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thanks! In local-only mode, your message is not sent.');
    contactForm.reset();
  });
});
