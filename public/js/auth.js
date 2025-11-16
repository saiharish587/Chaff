import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

// Global variables
let currentRole = 'manufacturer'; // Default role
let currentForm = 'loginForm';

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Form elements
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    // Modal elements
    const authModal = document.getElementById('authModal');
    const closeModal = document.getElementById('closeModal');
    const currentRoleElement = document.getElementById('currentRole');
    const changeRole = document.getElementById('changeRole');
    
    // Form navigation links
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const backToLogin = document.getElementById('backToLogin');
    
    // Role selection buttons
    const manufacturerButton = document.getElementById('manufacturerButton');
    const farmerButton = document.getElementById('farmerButton');
    
    // Navbar role buttons (if they exist)
    const navManufacturerBtn = document.getElementById('navManufacturerBtn');
    const navFarmerBtn = document.getElementById('navFarmerBtn');

    // Add navbar collapse functionality
    const navbarCollapse = document.querySelector('.navbar-collapse');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbarToggler = document.querySelector('.navbar-toggler');

    // Toggle navbar when clicking the hamburger menu
    if (navbarToggler) {
        navbarToggler.addEventListener('click', () => {
            // If navbar is already open, close it
            if (navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            } else {
                // If navbar is closed, open it
                navbarCollapse.classList.add('show');
            }
        });
    }

    // Close navbar when clicking on nav links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
        });
    });

    // Close navbar when clicking outside
    document.addEventListener('click', (e) => {
        const navbar = document.querySelector('.navbar');
        
        // Check if navbar is open and click is outside navbar
        if (navbarCollapse.classList.contains('show') && 
            !navbar.contains(e.target)) {
            navbarCollapse.classList.remove('show');
        }
    });

    // Event listeners - Form navigation
    if (switchToSignup) switchToSignup.addEventListener('click', e => {
        e.preventDefault();
        switchForm('signupForm');
    });
    
    if (switchToLogin) switchToLogin.addEventListener('click', e => {
        e.preventDefault();
        switchForm('loginForm');
    });
    
    if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', e => {
        e.preventDefault();
        switchForm('forgotPasswordForm');
    });
    
    if (backToLogin) backToLogin.addEventListener('click', e => {
        e.preventDefault();
        switchForm('loginForm');
    });
    
    // Event listeners - Modal controls
    if (closeModal) closeModal.addEventListener('click', () => {
        authModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });
    
    // Event listeners - Role change
    if (changeRole) changeRole.addEventListener('click', toggleRole);
    if (manufacturerButton) manufacturerButton.addEventListener('click', () => setActive('manufacturer'));
    if (farmerButton) farmerButton.addEventListener('click', () => setActive('farmer'));
    
    // Sync navbar role buttons if they exist
    if (navManufacturerBtn) navManufacturerBtn.addEventListener('click', () => setActive('manufacturer'));
    if (navFarmerBtn) navFarmerBtn.addEventListener('click', () => setActive('farmer'));
    
    // Event listeners - Form submissions
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    
    // Real-time validation for login form
    if (document.getElementById('loginEmail')) {
        document.getElementById('loginEmail').addEventListener('input', () => {
            validateEmail(document.getElementById('loginEmail'), 'login-email-validation');
        });
    }
    
    if (document.getElementById('loginPassword')) {
        document.getElementById('loginPassword').addEventListener('input', () => {
            const password = document.getElementById('loginPassword').value;
            const validationElement = document.getElementById('login-password-validation');
            
            if (!password) {
                validationElement.textContent = "Password is required";
                validationElement.style.display = 'block';
                validationElement.style.color = '#dc3545';
            } else {
                validationElement.style.display = 'none';
            }
        });
    }
    
    // Real-time validation for signup form
    if (document.getElementById('signupEmail')) {
        document.getElementById('signupEmail').addEventListener('input', () => {
            validateEmail(document.getElementById('signupEmail'), 'signup-email-validation');
        });
    }
    
    if (document.getElementById('signupPassword')) {
        document.getElementById('signupPassword').addEventListener('input', () => {
            validatePassword(document.getElementById('signupPassword'), 'signup-password-validation');
            if (document.getElementById('confirmPassword').value) {
                validatePasswordMatch();
            }
        });
    }
    
    if (document.getElementById('confirmPassword')) {
        document.getElementById('confirmPassword').addEventListener('input', validatePasswordMatch);
    }
    
    if (document.getElementById('signupName')) {
        document.getElementById('signupName').addEventListener('input', () => {
            validateName(document.getElementById('signupName'), 'signup-name-validation');
        });
    }
    
    // Real-time validation for reset form
    if (document.getElementById('resetEmail')) {
        document.getElementById('resetEmail').addEventListener('input', () => {
            validateEmail(document.getElementById('resetEmail'), 'reset-email-validation');
        });
    }
    
    // Check if user is logged in
    auth.onAuthStateChanged(handleAuthStateChanged);
});

// Form navigation functions
function switchForm(formId) {
    currentForm = formId;
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(formId).classList.add('active');
}

// Role management
function setActive(role) {
    currentRole = role;
    const authToggle = document.querySelector('.auth-toggle');
    
    // Toggle the farmer-active class based on role
    if (role === 'farmer') {
        authToggle.classList.add('farmer-active');
    } else {
        authToggle.classList.remove('farmer-active');
    }
    
    // Update role text in modal
    const currentRoleElements = document.querySelectorAll('[id^="currentRole"]');
    currentRoleElements.forEach(element => {
        if (element) {
            element.textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} Login`;
        }
    });
    
    // Close any open navbar dropdowns
    const dropdowns = document.querySelectorAll('.navbar-dropdown.show, .dropdown-menu.show');
    dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
    
    openAuthModal();
}

function toggleRole() {
    const newRole = currentRole === 'manufacturer' ? 'farmer' : 'manufacturer';
    setActive(newRole); // Use setActive to ensure all UI elements are updated
}

function openAuthModal() {
    const modal = document.getElementById('authModal');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (modal) {
        modal.style.display = 'block';
    }
    
    // Always close navbar when opening modal
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        navbarCollapse.classList.remove('show');
    }
    
    // Reset to login form
    switchForm('loginForm');
    
    // Clear form fields
    document.querySelectorAll('input').forEach(input => {
        input.value = '';
    });
    
    // Clear validation messages
    document.querySelectorAll('.validation-message').forEach(msg => {
        msg.style.display = 'none';
    });
}

// Validation functions
function validateEmail(emailInput, validationId) {
    const email = emailInput.value;
    const validationElement = document.getElementById(validationId);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        validationElement.textContent = "Email is required";
        validationElement.style.display = 'block';
        validationElement.style.color = '#dc3545';
        return false;
    } else if (!emailRegex.test(email)) {
        validationElement.textContent = "Please enter a valid email address";
        validationElement.style.display = 'block';
        validationElement.style.color = '#dc3545';
        return false;
    } else {
        validationElement.style.display = 'none';
        return true;
    }
}

function validatePassword(passwordInput, validationId) {
    // Only apply full validation if this is the signup password field
    if (passwordInput.id === 'loginPassword') {
        return true; // Skip validation for login password
    }
    
    const password = passwordInput.value;
    const validationElement = document.getElementById(validationId);
    
    // Password validation rules
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let errorMessage = [];
    
    if (password.length < minLength) {
        errorMessage.push("at least 8 characters");
    }
    if (!hasUpperCase) {
        errorMessage.push("1 uppercase letter");
    }
    if (!hasNumber) {
        errorMessage.push("1 number");
    }
    if (!hasSpecialChar) {
        errorMessage.push("1 special character");
    }
    
    if (errorMessage.length > 0) {
        validationElement.textContent = "Missing: " + errorMessage.join(", ");
        validationElement.style.display = 'block';
        validationElement.style.color = '#dc3545';
        return false;
    } else {
        validationElement.textContent = "Password meets requirements";
        validationElement.style.display = 'block';
        validationElement.style.color = '#198754';
        return true;
    }
}

function validatePasswordMatch() {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const validationElement = document.getElementById('confirm-password-validation');
    
    if (password !== confirmPassword) {
        validationElement.textContent = "Passwords do not match";
        validationElement.style.display = 'block';
        validationElement.style.color = '#dc3545';
        return false;
    } else if (confirmPassword) {
        validationElement.textContent = "Passwords match";
        validationElement.style.display = 'block';
        validationElement.style.color = '#198754';
        return true;
    } else {
        validationElement.style.display = 'none';
        return false;
    }
}

function validateName(nameInput, validationId) {
    const name = nameInput.value;
    const validationElement = document.getElementById(validationId);
    
    if (!name) {
        validationElement.textContent = "Name is required";
        validationElement.style.display = 'block';
        validationElement.style.color = '#dc3545';
        return false;
    } else if (name.length < 2) {
        validationElement.textContent = "Name must be at least 2 characters long";
        validationElement.style.display = 'block';
        validationElement.style.color = '#dc3545';
        return false;
    } else {
        validationElement.style.display = 'none';
        return true;
    }
}

// Authentication handlers
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const emailValidation = validateEmail(document.getElementById('loginEmail'), 'login-email-validation');
    
    // Remove password validation for login
    if (!emailValidation || !password) {
        // Just check if password is empty
        if (!password) {
            const validationElement = document.getElementById('login-password-validation');
            validationElement.textContent = "Password is required";
            validationElement.style.display = 'block';
            validationElement.style.color = '#dc3545';
            return;
        }
        return;
    }
    
    const loginButton = document.querySelector('#loginForm .submit-btn');
    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    
    try {
        // Special handling for admin
        if (email === 'admin@gmail.com') {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            showNotification('Welcome Admin!', 'success');
            setTimeout(() => {
                window.location.href = '/html/admin.html';
            }, 1000);
            return;
        }
        
        // First, check if user exists and has correct role
        const emailQuery = query(
            collection(db, 'users'), 
            where('email', '==', email)
        );
        
        const emailSnapshot = await getDocs(emailQuery);
        
        if (emailSnapshot.empty) {
            showNotification('No account found with this email address', 'error');
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
            return;
        }
        
        const userData = emailSnapshot.docs[0].data();
        if (userData.role !== currentRole) {
            showNotification(`This email is registered as a ${userData.role}, not a ${currentRole}`, 'error');
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
            return;
        }
        
        // Now proceed with login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        showNotification(`Welcome back, ${userData.name}!`, 'success');
        
        // Redirect to appropriate dashboard
        setTimeout(() => {
            window.location.href = userData.role === 'farmer' 
                ? '/html/farmer-dashboard.html' 
                : '/html/manufacturer-dashboard.html';
        }, 1000);
        
    } catch (error) {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
        
        if (error.code === 'auth/user-not-found') {
            showNotification('No account found with this email address', 'error');
        } else if (error.code === 'auth/wrong-password') {
            showNotification('Incorrect password', 'error');
        } else if (error.code === 'auth/too-many-requests') {
            showNotification('Too many failed login attempts. Please try again later or reset your password', 'error');
        } else if (error.code === 'auth/network-request-failed') {
            showNotification('Network error. Please check your connection and try again', 'error');
        } else {
            showNotification(`Error: ${error.message}`, 'error');
        }
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    const nameValidation = validateName(document.getElementById('signupName'), 'signup-name-validation');
    const emailValidation = validateEmail(document.getElementById('signupEmail'), 'signup-email-validation');
    const passwordValidation = validatePassword(document.getElementById('signupPassword'), 'signup-password-validation');
    const passwordMatchValidation = validatePasswordMatch();
    
    if (!nameValidation || !emailValidation || !passwordValidation || !passwordMatchValidation) {
        return;
    }
    
    const signupButton = document.querySelector('#signupForm .submit-btn');
    signupButton.disabled = true;
    signupButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    
    try {
        // Check if email already exists in either role
        const emailQuery = query(
            collection(db, 'users'), 
            where('email', '==', email)
        );
        
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
            const userData = emailSnapshot.docs[0].data();
            showNotification(`This email is already registered as a ${userData.role}`, 'error');
            signupButton.disabled = false;
            signupButton.textContent = 'Create Account';
            return;
        }
        
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Store user data with role in users collection
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: name,
            email: email,
            role: currentRole,
            profileComplete: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        showNotification(`Welcome ${name}! Please complete your ${currentRole} profile.`, 'success');
        
        // Redirect to appropriate registration page
        setTimeout(() => {
            window.location.href = currentRole === 'farmer' 
                ? '/html/farmer_data.html' 
                : '/html/manufacturer_registration.html';
        }, 1500);
        
    } catch (error) {
        signupButton.disabled = false;
        signupButton.textContent = 'Create Account';
        
        if (error.code === 'auth/email-already-in-use') {
            showNotification('This email is already in use', 'error');
        } else if (error.code === 'auth/invalid-email') {
            showNotification('Invalid email format', 'error');
        } else if (error.code === 'auth/weak-password') {
            showNotification('Password should be at least 6 characters', 'error');
        } else if (error.code === 'auth/network-request-failed') {
            showNotification('Network error. Please check your connection and try again', 'error');
        } else {
            showNotification(`Error: ${error.message}`, 'error');
        }
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    const emailValidation = validateEmail(document.getElementById('resetEmail'), 'reset-email-validation');
    
    if (!emailValidation) {
        return;
    }
    
    const resetButton = document.querySelector('#forgotPasswordForm .submit-btn');
    resetButton.disabled = true;
    resetButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        // Check if email exists in user database first
        const emailQuery = query(
            collection(db, 'users'), 
            where('email', '==', email)
        );
        
        const emailSnapshot = await getDocs(emailQuery);
        
        if (emailSnapshot.empty) {
            showNotification('No account found with this email address', 'error');
            resetButton.disabled = false;
            resetButton.textContent = 'Send Reset Link';
            return;
        }
        
        await sendPasswordResetEmail(auth, email);
        showNotification('Password reset link sent to your email', 'success');
        resetButton.disabled = false;
        resetButton.textContent = 'Send Reset Link';
        switchForm('loginForm');
    } catch (error) {
        resetButton.disabled = false;
        resetButton.textContent = 'Send Reset Link';
        
        if (error.code === 'auth/user-not-found') {
            showNotification('No account found with this email address', 'error');
        } else if (error.code === 'auth/invalid-email') {
            showNotification('Invalid email format', 'error');
        } else if (error.code === 'auth/too-many-requests') {
            showNotification('Too many requests. Please try again later', 'error');
        } else if (error.code === 'auth/network-request-failed') {
            showNotification('Network error. Please check your connection and try again', 'error');
        } else {
            showNotification(`Error: ${error.message}`, 'error');
        }
    }
}

async function handleAuthStateChanged(user) {
    if (user) {
        // Check if user is admin
        if (user.email === 'admin@gmail.com') {
            if (!window.location.pathname.includes('/html/admin.html')) {
                window.location.href = '/html/admin.html';
            }
            return;
        }

        // For non-admin users, proceed with profile check
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const currentPath = window.location.pathname;
                
                // If we're on the index page or login page
                if (currentPath === '/' || currentPath === '/index.html' || currentPath === '/html/login.html') {
                    // Check if profile is complete
                    if (userData.profileComplete) {
                        // Redirect to appropriate dashboard
                        window.location.href = userData.role === 'farmer' 
                            ? '/html/farmer-dashboard.html' 
                            : '/html/manufacturer-dashboard.html';
                    } else {
                        // Redirect to appropriate registration page
                        window.location.href = userData.role === 'farmer' 
                            ? '/html/farmer_data.html' 
                            : '/html/manufacturer_registration.html';
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    } else {
        // Only redirect to index if we're not already there
        if (window.location.pathname !== '/' && 
            window.location.pathname !== '/index.html' && 
            window.location.pathname !== '/html/login.html') {
            window.location.href = '/index.html';
        }
    }
}

// Utility functions
function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create new notification
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export the signOut function so it can be used in dashboards
export function logoutUser() {
    return signOut(auth)
        .then(() => {
            // Clear any stored user data from browser
            sessionStorage.clear();
            localStorage.removeItem('user');
            // Redirect to home page with a parameter to prevent auto-login
            window.location.href = '/?logout=true';
        })
        .catch(error => {
            console.error("Error signing out:", error);
        });
}
