import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

let formData = {
    // Step 1: Contact & Business Information
    name: '',
    mobile: '',
    businessName: '',
    businessType: '',
    gstNumber: '',
    companyLogo: '',
    
    // Step 2: Business Address & Location
    state: '',
    district: '',
    city: '',
    pincode: '',
    coordinates: '',
    
    // Step 3: Manufacturing Requirements
    stubbleTypes: [],
    monthlyRequirement: ''
};

let statesAndDistricts = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initially hide the loading spinner
    const loadingContainer = document.getElementById('loading-container');
    const profileContainer = document.getElementById('profile-setup-container');
    
    if (loadingContainer) loadingContainer.style.display = 'block';
    if (profileContainer) profileContainer.style.display = 'none';

    // Check authentication state
    auth.onAuthStateChanged(async (user) => {
        try {
            if (!user) {
                window.location.href = '/index.html';
                return;
            }

            // Load user data
            await loadUserData(user);

            // Setup form
            setupFormValidation();
            setupEventListeners();
            loadStatesAndDistricts();

            // Hide loading spinner and show form
            if (loadingContainer) loadingContainer.style.display = 'none';
            if (profileContainer) profileContainer.style.display = 'block';
        } catch (error) {
            console.error('Error during initialization:', error);
            showNotification('An error occurred while loading the page. Please refresh.', 'error');
        }
    });
});

// Function to load user data
async function loadUserData(user) {
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const manufacturerDocRef = doc(db, 'manufacturers', user.uid);
        
        const [userDocSnap, manufacturerDocSnap] = await Promise.all([
            getDoc(userDocRef),
            getDoc(manufacturerDocRef)
        ]);

        // If manufacturer profile exists and is complete, redirect to dashboard
        if (manufacturerDocSnap.exists() && manufacturerDocSnap.data().profileComplete) {
            window.location.href = '/html/manufacturer-dashboard.html';
            return;
        }

        // Set name if available from user document
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const nameInput = document.getElementById('name');
            if (nameInput && userData.name) {
                nameInput.value = userData.name;
                validateStep1();
            }
        }

        // If manufacturer profile exists but is incomplete, populate available data
        if (manufacturerDocSnap.exists()) {
            const manufacturerData = manufacturerDocSnap.data();
            populateExistingData(manufacturerData);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}

// Function to load states and districts data
async function loadStatesAndDistricts() {
    try {
        const response = await fetch('../js/list.json');
        if (!response.ok) {
            throw new Error('Failed to load states data');
        }
        const data = await response.json();
        statesAndDistricts = data;
        populateStates();
    } catch (error) {
        console.error('Error loading states data:', error);
        showError('state-error', 'Failed to load states data');
    }
}

// Function to populate states dropdown
function populateStates() {
    const stateSelect = document.getElementById('state');
    if (!stateSelect) return;

    // Clear existing options
    stateSelect.innerHTML = '<option value="">Select State</option>';
    
    if (statesAndDistricts && typeof statesAndDistricts === 'object') {
        // Sort states alphabetically
        const sortedStates = Object.keys(statesAndDistricts).sort();
        
        sortedStates.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
    }
}

// Function to populate districts based on selected state
function populateDistricts(state) {
    const districtSelect = document.getElementById('district');
    if (!districtSelect) return;

    // Clear existing options
    districtSelect.innerHTML = '<option value="">Select District</option>';
    
    if (statesAndDistricts && statesAndDistricts[state]) {
        // Sort districts alphabetically
        const sortedDistricts = statesAndDistricts[state].sort();
        
        sortedDistricts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
        districtSelect.disabled = false;
    } else {
        districtSelect.disabled = true;
    }
}

// Setup form validation
function setupFormValidation() {
    // Name field edit functionality
    const nameInput = document.getElementById('name');
    const editNameBtn = document.getElementById('editNameBtn');
    
    editNameBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (nameInput.readOnly) {
            nameInput.readOnly = false;
            nameInput.focus();
            nameInput.classList.add('editing');
            editNameBtn.innerHTML = '<i class="fas fa-check"></i>';
        } else {
            nameInput.readOnly = true;
            nameInput.classList.remove('editing');
            editNameBtn.innerHTML = '<i class="fas fa-edit"></i>';
            validateStep1();
        }
    });

    // Mobile number validation
    const mobileInput = document.getElementById('mobile');
    mobileInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        validateStep1();
    });

    // Business name validation
    const businessNameInput = document.getElementById('business-name');
    businessNameInput.addEventListener('input', validateStep1);

    // Business type validation
    const businessTypeSelect = document.getElementById('business-type');
    businessTypeSelect.addEventListener('change', validateStep1);

    // GST number validation (optional)
    const gstInput = document.getElementById('gst');
    gstInput.addEventListener('input', function() {
        if (this.value) {
            validateGSTNumber(this.value);
        } else {
            clearError('gst-error');
        }
        validateStep1();
    });

    // Company logo upload
    setupLogoUpload();
}

// Function to handle logo upload
function setupLogoUpload() {
    const dropZone = document.getElementById('logo-drop-zone');
    const logoInput = document.getElementById('logo-input');
    const previewContainer = document.getElementById('logo-preview-container');
    const logoPreview = document.getElementById('logo-preview');
    const removeButton = document.getElementById('remove-logo');

    dropZone.addEventListener('click', () => logoInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        handleLogoFile(file);
    });

    logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleLogoFile(file);
    });

    removeButton.addEventListener('click', () => {
        logoInput.value = '';
        formData.companyLogo = '';
        previewContainer.style.display = 'none';
        dropZone.querySelector('p').style.display = 'block';
        dropZone.querySelector('i').style.display = 'block';
    });
}

// Function to handle logo file
function handleLogoFile(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewContainer = document.getElementById('logo-preview-container');
            const logoPreview = document.getElementById('logo-preview');
            const dropZone = document.getElementById('logo-drop-zone');

            logoPreview.src = e.target.result;
            formData.companyLogo = e.target.result; // Store base64 image
            previewContainer.style.display = 'block';
            dropZone.querySelector('p').style.display = 'none';
            dropZone.querySelector('i').style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please upload an image file');
    }
}

// Validation functions
function validateStep1() {
    const name = document.getElementById('name').value;
    const mobile = document.getElementById('mobile').value;
    const businessName = document.getElementById('business-name').value;
    const businessType = document.getElementById('business-type').value;

    let isValid = true;

    // Validate name
    if (!name || name.trim().length < 2) {
        showError('name-error', 'Please enter a valid name');
        isValid = false;
    } else {
        clearError('name-error');
    }

    // Validate mobile
    if (!mobile || mobile.length !== 10) {
        showError('mobile-error', 'Please enter a valid 10-digit mobile number');
        isValid = false;
    } else {
        clearError('mobile-error');
    }

    // Validate business name
    if (!businessName || businessName.trim().length < 2) {
        showError('business-name-error', 'Please enter a valid business name');
        isValid = false;
    } else {
        clearError('business-name-error');
    }

    // Validate business type
    if (!businessType) {
        showError('business-type-error', 'Please select a business type');
        isValid = false;
    } else {
        clearError('business-type-error');
    }

    document.getElementById('step1Next').disabled = !isValid;
    return isValid;
}

// Function to validate pincode
function validatePincode(pincode) {
    const pincodeInput = document.getElementById('pincode');
    const errorElement = document.getElementById('pincode-error');
    const feedbackElement = document.getElementById('pincode-feedback');
    
    // Clear previous validation state
    clearValidationState(pincodeInput, errorElement, feedbackElement);
    
    // Regular expression for Indian pincode (6 digits)
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    
    if (!pincode || pincode.trim() === '') {
        showValidationError(pincodeInput, errorElement, "Pincode is required", feedbackElement);
        return false;
    }
    
    if (!pincodeRegex.test(pincode)) {
        showValidationError(pincodeInput, errorElement, "Please enter a valid 6-digit pincode", feedbackElement);
        return false;
    }
    
    // Additional validation for first digit (should be 1-9)
    if (pincode[0] === '0') {
        showValidationError(pincodeInput, errorElement, "Pincode cannot start with 0", feedbackElement);
        return false;
    }
    
    showValidationSuccess(pincodeInput, errorElement, feedbackElement);
    return true;
}

// Function to validate town/city
function validateCity(city) {
    const cityInput = document.getElementById('city');
    const errorElement = document.getElementById('city-error');
    
    // Clear previous validation state
    clearValidationState(cityInput, errorElement);
    
    // Remove extra spaces and check for valid characters
    const sanitizedCity = city.trim().replace(/\s+/g, ' ');
    const cityRegex = /^[a-zA-Z\s.'-]{2,50}$/;
    
    if (!sanitizedCity) {
        showValidationError(cityInput, errorElement, "Town/City name is required");
        return false;
    }
    
    if (sanitizedCity.length < 2) {
        showValidationError(cityInput, errorElement, "Town/City name must be at least 2 characters long");
        return false;
    }
    
    if (sanitizedCity.length > 50) {
        showValidationError(cityInput, errorElement, "Town/City name cannot exceed 50 characters");
        return false;
    }
    
    if (!cityRegex.test(sanitizedCity)) {
        showValidationError(cityInput, errorElement, "Please enter a valid town/city name (letters, spaces, and basic punctuation only)");
        return false;
    }
    
    showValidationSuccess(cityInput, errorElement);
    return true;
}

// Helper functions for validation UI
function showValidationError(inputElement, errorElement, message, feedbackElement = null) {
    if (inputElement) {
        inputElement.classList.remove('valid');
        inputElement.classList.add('invalid');
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    if (feedbackElement) {
        feedbackElement.innerHTML = '<i class="fas fa-times"></i>';
        feedbackElement.classList.remove('success');
        feedbackElement.classList.add('error', 'show');
    }
}

function showValidationSuccess(inputElement, errorElement, feedbackElement = null) {
    if (inputElement) {
        inputElement.classList.remove('invalid');
        inputElement.classList.add('valid');
    }
    
    if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.textContent = '';
    }
    
    if (feedbackElement) {
        feedbackElement.innerHTML = '<i class="fas fa-check"></i>';
        feedbackElement.classList.remove('error');
        feedbackElement.classList.add('success', 'show');
    }
}

function clearValidationState(inputElement, errorElement, feedbackElement = null) {
    if (inputElement) {
        inputElement.classList.remove('valid', 'invalid');
    }
    
    if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.textContent = '';
    }
    
    if (feedbackElement) {
        feedbackElement.classList.remove('error', 'success', 'show');
    }
}

// Update the validateStep2 function to remove district validation
function validateStep2() {
    const state = document.getElementById('state').value;
    const city = document.getElementById('city').value;
    const pincode = document.getElementById('pincode').value;
    
    let isValid = true;
    
    // Validate state
    if (!state) {
        showValidationError(
            document.getElementById('state'),
            document.getElementById('state-error'),
            "Please select a state"
        );
        isValid = false;
    } else {
        showValidationSuccess(
            document.getElementById('state'),
            document.getElementById('state-error')
        );
    }
    
    // Validate city and pincode
    isValid = validateCity(city) && isValid;
    isValid = validatePincode(pincode) && isValid;
    
    // Enable/disable next button based on validation
    document.getElementById('step2Next').disabled = !isValid;
    
    return isValid;
}

// Update validateStep3 function to ensure proper data types
function validateStep3() {
    const stubbleCheckboxes = document.querySelectorAll('input[name="stubble"]:checked');
    const monthlyRequirementInput = document.getElementById('monthly-requirement');
    const monthlyRequirement = monthlyRequirementInput ? parseFloat(monthlyRequirementInput.value) : 0;
    const submitBtn = document.getElementById('submitBtn');

    let isValid = true;

    // Validate stubble selection
    if (stubbleCheckboxes.length === 0) {
        showError('stubble-error', 'Please select at least one type of stubble');
        isValid = false;
    } else {
        clearError('stubble-error');
    }

    // Validate monthly requirement
    if (!monthlyRequirement || monthlyRequirement <= 0 || isNaN(monthlyRequirement)) {
        showError('monthly-requirement-error', 'Please enter a valid monthly requirement greater than 0');
        isValid = false;
    } else {
        clearError('monthly-requirement-error');
    }

    // Enable/disable submit button
    if (submitBtn) {
        submitBtn.disabled = !isValid;
    }

    return isValid;
}

// Add event listener for monthly requirement input
function setupMonthlyRequirementValidation() {
    const monthlyRequirementInput = document.getElementById('monthly-requirement');
    if (monthlyRequirementInput) {
        monthlyRequirementInput.addEventListener('input', function() {
            // Remove any non-numeric characters except decimal point
            this.value = this.value.replace(/[^\d.]/g, '');
            
            // Ensure only one decimal point
            const parts = this.value.split('.');
            if (parts.length > 2) {
                this.value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            // Convert to number and validate
            const value = parseFloat(this.value);
            if (!isNaN(value) && value > 0) {
                clearError('monthly-requirement-error');
            } else {
                showError('monthly-requirement-error', 'Please enter a valid number greater than 0');
            }
            
            validateStep3();
        });
    }
}

// Helper functions
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

function validateGSTNumber(gst) {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (gst && !gstRegex.test(gst)) {
        showError('gst-error', 'Please enter a valid GST number');
        return false;
    }
    clearError('gst-error');
    return true;
}

// Navigation functions
function previousStep(currentStep) {
    if (currentStep <= 1) return;
    
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${currentStep - 1}`).classList.add('active');
    document.querySelector('.progress-bar').setAttribute('data-step', currentStep - 1);
    document.querySelectorAll('.progress-step')[currentStep - 1].classList.remove('active');
    document.querySelectorAll('.progress-step')[currentStep - 2].classList.remove('completed');
}

function nextStep(currentStep) {
    if (currentStep >= 3) return;
    
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${currentStep + 1}`).classList.add('active');
    document.querySelector('.progress-bar').setAttribute('data-step', currentStep + 1);
    document.querySelectorAll('.progress-step')[currentStep - 1].classList.add('completed');
    document.querySelectorAll('.progress-step')[currentStep].classList.add('active');
}

// Setup event listeners
function setupEventListeners() {
    // Previous buttons
    const prevButtons = document.querySelectorAll('button[type="button"][onclick^="previousStep"]');
    prevButtons.forEach(button => {
        button.removeAttribute('onclick'); // Remove inline onclick
        button.addEventListener('click', function() {
            const currentStep = parseInt(document.querySelector('.progress-bar').getAttribute('data-step'));
            previousStep(currentStep);
        });
    });

    // Next buttons
    document.getElementById('step1Next').addEventListener('click', () => {
        if (validateStep1()) nextStep(1);
    });

    document.getElementById('step2Next').addEventListener('click', () => {
        if (validateStep2()) nextStep(2);
    });

    // Setup state-district handling
    setupStateDistrictListeners();
    
    // Load states and districts when the page loads
    loadStatesAndDistricts();

    // Get location functionality
    document
    .getElementById("getLocationBtn")
    .addEventListener("click", function () {
      const statusElement = document.getElementById("coordinates-status");
      const coordinatesInput = document.getElementById("coordinates");
      const locationBtn = this; // Reference to the button itself
  
      // Disable button and show loading state
      locationBtn.disabled = true;
      const originalButtonText = locationBtn.innerHTML;
      locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
      
      statusElement.classList.add("fetching");
  
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            coordinatesInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            statusElement.textContent = "Location fetched successfully";
            statusElement.style.color = "green";
            statusElement.classList.remove("fetching");
            
            // Re-enable button and restore original text
            locationBtn.disabled = false;
            locationBtn.innerHTML = originalButtonText;
          },
          function (error) {
            statusElement.textContent = `Error: ${error.message}`;
            statusElement.style.color = "red";
            statusElement.classList.remove("fetching");
            
            // Re-enable button and restore original text
            locationBtn.disabled = false;
            locationBtn.innerHTML = originalButtonText;
          },
          // Add options to improve accuracy and set timeout
          { 
            enableHighAccuracy: true,
            timeout: 10000, // 10 seconds timeout
            maximumAge: 0
          }
        );
      } else {
        statusElement.textContent = "Geolocation is not supported by this browser";
        statusElement.style.color = "red";
        statusElement.classList.remove("fetching");
        
        // Re-enable button and restore original text
        locationBtn.disabled = false;
        locationBtn.innerHTML = originalButtonText;
      }
    });

    setupMonthlyRequirementValidation();
    
    // Submit button handler
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (validateStep3()) {
                await handleFormSubmit(submitBtn);
            }
        });
    }

    // Real-time validation for city
    const cityInput = document.getElementById('city');
    if (cityInput) {
        cityInput.addEventListener('input', function(e) {
            // Prevent numbers in city name
            this.value = this.value.replace(/[0-9]/g, '');
            
            // Capitalize first letter of each word
            this.value = this.value.replace(/\b\w/g, letter => letter.toUpperCase());
            
            if (this.value) {
                validateCity(this.value);
            }
            validateStep2();
        });
        
        // Validate on blur
        cityInput.addEventListener('blur', function() {
            if (this.value) {
                validateCity(this.value);
            }
            validateStep2();
        });
    }
    
    // Real-time validation for pincode
    const pincodeInput = document.getElementById('pincode');
    if (pincodeInput) {
        pincodeInput.addEventListener('input', function(e) {
            // Allow only numbers
            this.value = this.value.replace(/\D/g, '');
            
            // Limit to 6 digits
            if (this.value.length > 6) {
                this.value = this.value.slice(0, 6);
            }
            
            if (this.value) {
                validatePincode(this.value);
            }
            validateStep2();
        });
        
        // Validate on blur
        pincodeInput.addEventListener('blur', function() {
            if (this.value) {
                validatePincode(this.value);
            }
            validateStep2();
        });
    }

    // Stubble checkboxes
    const stubbleCheckboxes = document.querySelectorAll('input[name="stubble"]');
    stubbleCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', validateStep3);
    });
}

// Setup event listeners for state-district dependency
function setupStateDistrictListeners() {
    const stateSelect = document.getElementById('state');
    const districtSelect = document.getElementById('district');
    
    if (stateSelect && districtSelect) {
        stateSelect.addEventListener('change', function() {
            const selectedState = this.value;
            
            // Reset and disable district select if no state is selected
            if (!selectedState) {
                districtSelect.innerHTML = '<option value="">Select District</option>';
                districtSelect.disabled = true;
                return;
            }
            
            // Populate districts for selected state
            populateDistricts(selectedState);
            
            // Validate step 2 after state change
            validateStep2();
        });

        // Add change event listener to district select for validation
        districtSelect.addEventListener('change', validateStep2);
    }
}

// Add a notification function if not already present
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    // Add new notification
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => notification.remove(), 3000);
}

// Function to handle form submission
async function handleFormSubmit(submitBtn) {
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        // Basic user data for users collection
        const userData = {
            name: document.getElementById('name').value,
            email: user.email,
            role: 'manufacturer',
            profileComplete: true,
            updatedAt: new Date().toISOString()
        };

        // Detailed manufacturer data for manufacturers collection
        const manufacturerData = {
            // User reference
            userId: user.uid,
            email: user.email,
            
            // Basic Info
            name: document.getElementById('name').value,
            mobileNumber: document.getElementById('mobile').value,
            businessName: document.getElementById('business-name').value,
            businessType: document.getElementById('business-type').value,
            gstNumber: document.getElementById('gst').value || null,
            companyLogo: formData.companyLogo || null,
            
            // Location Info
            state: document.getElementById('state').value,
            city: document.getElementById('city').value,
            pincode: document.getElementById('pincode').value,
            coordinates: document.getElementById('coordinates').value || null,
            
            // Manufacturing Info
            stubbleTypes: Array.from(document.querySelectorAll('input[name="stubble"]:checked'))
                .map(checkbox => checkbox.value),
            monthlyRequirement: parseFloat(document.getElementById('monthly-requirement').value),
            
            // Metadata
            status: 'active',
            profileComplete: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Create a batch write to ensure both writes succeed or fail together
        const batch = writeBatch(db);

        // Update user document in users collection
        const userRef = doc(db, 'users', user.uid);
        batch.set(userRef, userData, { merge: true });

        // Add manufacturer document to manufacturers collection
        const manufacturerRef = doc(db, 'manufacturers', user.uid);
        batch.set(manufacturerRef, manufacturerData);

        // Commit the batch
        await batch.commit();
        
        showNotification('Profile successfully saved!', 'success');
        
        // Delay redirect to ensure notification is seen
        setTimeout(() => {
            window.location.href = '/html/manufacturer-dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Error saving profile:', error);
        showNotification('Failed to save profile. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
    }
}

// Helper function to populate existing data if available
function populateExistingData(data) {
    // Populate basic info
    if (data.mobileNumber) {
        document.getElementById('mobile').value = data.mobileNumber;
    }
    if (data.businessName) {
        document.getElementById('business-name').value = data.businessName;
    }
    if (data.businessType) {
        document.getElementById('business-type').value = data.businessType;
    }
    if (data.gstNumber) {
        document.getElementById('gst').value = data.gstNumber;
    }
    if (data.companyLogo) {
        formData.companyLogo = data.companyLogo;
        displayCompanyLogo(data.companyLogo);
    }

    // Populate location info
    if (data.state) {
        document.getElementById('state').value = data.state;
    }
    if (data.city) {
        document.getElementById('city').value = data.city;
    }
    if (data.pincode) {
        document.getElementById('pincode').value = data.pincode;
    }
    if (data.coordinates) {
        document.getElementById('coordinates').value = data.coordinates;
    }

    // Populate manufacturing info
    if (data.stubbleTypes && Array.isArray(data.stubbleTypes)) {
        data.stubbleTypes.forEach(type => {
            const checkbox = document.querySelector(`input[name="stubble"][value="${type}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
    if (data.monthlyRequirement) {
        document.getElementById('monthly-requirement').value = data.monthlyRequirement;
    }

    // Validate all steps after populating data
    validateStep1();
    validateStep2();
    validateStep3();
}

// Helper function to display company logo
function displayCompanyLogo(logoData) {
    const previewContainer = document.getElementById('logo-preview-container');
    const logoPreview = document.getElementById('logo-preview');
    const dropZone = document.getElementById('logo-drop-zone');

    if (previewContainer && logoPreview && dropZone) {
        logoPreview.src = logoData;
        previewContainer.style.display = 'block';
        dropZone.querySelector('p').style.display = 'none';
        dropZone.querySelector('i').style.display = 'none';
    }
} 