// Firebase imports
import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

// Make functions globally available by attaching to window
window.setActive = function(role) {
    currentRole = role;
    const manufacturerBtn = document.getElementById('manufacturerButton');
    const farmerBtn = document.getElementById('farmerButton');
    
    if (manufacturerBtn && farmerBtn) {
        manufacturerBtn.classList.toggle('active', role === 'manufacturer');
        farmerBtn.classList.toggle('active', role === 'farmer');
    }
    
    // Update modal role text and show modal
    const currentRoleElement = document.getElementById('currentRole');
    if (currentRoleElement) {
        currentRoleElement.textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} Login`;
    }
    
    // Show modal
    openAuthModal();
}

window.openAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'block';
}

window.closeAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

// Initialize auth modal
window.initAuthModal = function() {
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('authModal');
        if (event.target === modal) {
            window.closeAuthModal();
        }
    };

    // Close modal when clicking close button
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = window.closeAuthModal;
    }
}

// Global variable
let currentRole = 'manufacturer';

// DOM Ready handler
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initSlideshow();
    initScrollAnimations();
    initSmoothScroll();
    initNavbarScroll();
    initFormHandling();
    
    // Contact form submission handler
    const contactForm = document.querySelector('.newsletter-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const form = e.target;
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            
            try {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                
                const formData = {
                    name: form.querySelector('input[type="text"]').value,
                    email: form.querySelector('input[type="email"]').value,
                    message: form.querySelector('textarea').value,
                    timestamp: new Date().toISOString()
                };
                
                await addDoc(collection(db, 'contactSubmissions'), formData);
                
                // Clear form
                form.reset();
                
                // Show success message
                alert('Thank you for your message! We will get back to you soon.');
                
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('There was an error sending your message. Please try again.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    // Navbar functionality
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', function() {
            navbarCollapse.classList.toggle('show');
        });
        
        // Close navbar when clicking outside
        document.addEventListener('click', function(e) {
            if (!navbarToggler.contains(e.target) && !navbarCollapse.contains(e.target)) {
                navbarCollapse.classList.remove('show');
            }
        });
    }
    
    // Initialize auth modal
    window.initAuthModal();
});

// Slideshow Functionality
function initSlideshow() {
    const slideshow = {
        slides: document.querySelectorAll('.hero-slide'),
        currentSlide: 0,
        slideInterval: null,
        indicators: document.querySelector('.slide-indicators'),
        
        init() {
            // Create indicators
            this.slides.forEach((_, index) => {
                const indicator = document.createElement('div');
                indicator.classList.add('slide-indicator');
                indicator.addEventListener('click', () => this.goToSlide(index));
                this.indicators.appendChild(indicator);
            });
            
            // Set first slide and indicator as active
            this.slides[0].classList.add('active');
            this.indicators.children[0].classList.add('active');
            
            // Start autoplay
            this.startAutoplay();
            
            // Add navigation listeners
            document.querySelector('.prev-slide').addEventListener('click', () => this.prevSlide());
            document.querySelector('.next-slide').addEventListener('click', () => this.nextSlide());
            
            // Pause on hover
            const heroSection = document.querySelector('.hero-section');
            heroSection.addEventListener('mouseenter', () => this.pauseAutoplay());
            heroSection.addEventListener('mouseleave', () => this.startAutoplay());
        },
        
        goToSlide(index) {
            // Fade out current slide
            this.slides[this.currentSlide].classList.remove('active');
            this.indicators.children[this.currentSlide].classList.remove('active');
            
            // Update current slide
            this.currentSlide = index;
            if (this.currentSlide >= this.slides.length) this.currentSlide = 0;
            if (this.currentSlide < 0) this.currentSlide = this.slides.length - 1;
            
            // Fade in new slide
            this.slides[this.currentSlide].classList.add('active');
            this.indicators.children[this.currentSlide].classList.add('active');
        },
        
        nextSlide() {
            this.goToSlide(this.currentSlide + 1);
        },
        
        prevSlide() {
            this.goToSlide(this.currentSlide - 1);
        },
        
        startAutoplay() {
            if (this.slideInterval) clearInterval(this.slideInterval);
            this.slideInterval = setInterval(() => this.nextSlide(), 2500);
        },
        
        pauseAutoplay() {
            if (this.slideInterval) clearInterval(this.slideInterval);
        }
    };
    
    slideshow.init();
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.classList.contains('stat-item')) {
                    const numberElement = entry.target.querySelector('.stat-number');
                    // Store the target value
                    const targetValue = numberElement.textContent;
                    numberElement.setAttribute('data-value', targetValue);
                    // Reset to 0 and start animation
                    numberElement.textContent = '0';
                    setTimeout(() => animateValue(numberElement), 100);
                }
            }
        });
    }, observerOptions);
    
    // Observe elements
    document.querySelectorAll('.timeline-item, .mission-card, .dont-burn-header, .stat-item')
        .forEach(el => observer.observe(el));
}

// Animate Value
function animateValue(element) {
    const start = 0;
    const end = parseInt(element.getAttribute('data-value') || element.textContent);
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out function
        const easeOut = t => 1 - Math.pow(1 - t, 3);
        
        const currentValue = Math.floor(easeOut(progress) * (end - start) + start);
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        } else {
            element.textContent = end;
        }
    }
    
    // Start with 0
    element.textContent = start;
    requestAnimationFrame(updateValue);
}

// Smooth Scroll with proper selector check
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') {
            e.preventDefault();
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Navbar Scroll Effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        if (currentScroll > lastScroll) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
}

// Form Handling
function initFormHandling() {
    const form = document.querySelector('.newsletter-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Success message
                showNotification('Thank you for your message! We will get back to you soon.', 'success');
                form.reset();
            } catch (error) {
                showNotification('Something went wrong. Please try again.', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Notification System
function showNotification(type, message) {
    alert(message);
}

// Auth Modal Functionality
function toggleRole() {
    currentRole = currentRole === 'manufacturer' ? 'farmer' : 'manufacturer';
    const currentRoleElement = document.getElementById('currentRole');
    if (currentRoleElement) {
        currentRoleElement.textContent = `${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Login`;
    }
}

// Navbar dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', function() {
            navbarCollapse.classList.toggle('show');
        });
        
        // Close navbar when clicking outside
        document.addEventListener('click', function(e) {
            if (!navbarToggler.contains(e.target) && !navbarCollapse.contains(e.target)) {
                navbarCollapse.classList.remove('show');
            }
        });
    }
    
    // Initialize auth modal
    initAuthModal();
}); 