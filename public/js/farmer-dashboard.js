import { doc, getDoc, updateDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';
import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

let formData = {
    // Step 1: Basic Information
    name: '',
    dob: '',
    mobile: '',
    language: '',
    
    // Step 2: Location Information
    state: '',
    district: '',
    village: '',
    pincode: '',
    coordinates: '',
    
    // Step 3: Farm Information
    soilType: '',
    crops: [],
    landSize: '',
    profilePhotoUrl: '',
    companyLogo: ''
};

let statesAndDistricts = null;

// Function to load states and districts data
async function loadStatesAndDistricts() {
    try {
        const response = await fetch('/js/list.json');
        if (!response.ok) {
            throw new Error('Failed to load states data');
        }
        statesAndDistricts = await response.json();
        populateStates(); // Populate states dropdown once data is loaded
    } catch (error) {
        console.error('Error loading states data:', error);
        showError(document.getElementById('state-error'), 'Failed to load states data');
    }
}

// Function to populate states dropdown
function populateStates() {
    const stateSelect = document.getElementById('state');
    stateSelect.innerHTML = '<option value="">Select State</option>';
    
    if (statesAndDistricts) {
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

// Navigation functions
function nextStep(currentStep) {
    if (validateStep(currentStep)) {
        document.getElementById(`step${currentStep}`).classList.remove('active');
        document.getElementById(`step${currentStep + 1}`).classList.add('active');
        document.querySelector('.progress-bar').dataset.step = currentStep + 1;
    }
}

function previousStep(currentStep) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${currentStep - 1}`).classList.add('active');
    document.querySelector('.progress-bar').dataset.step = currentStep - 1;
}

// Validation functions
function validateStep(step) {
    switch(step) {
        case 1:
            return validateStepOne();
        case 2:
            return validateStepTwo();
        case 3:
            return validateStepThree();
        default:
            return true;
    }
}

function validateStepOne() {
    const name = document.getElementById('name').value;
    const dob = document.getElementById('dob').value;
    const mobile = document.getElementById('mobile').value;
    const language = document.getElementById('language').value;

    return validateName(name) && 
           validateAge(dob) && 
           validatePhone(mobile) && 
           validateLanguage(language);
}

function validateName(name) {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    const errorElement = document.getElementById('name-error');
    
    if (!name) {
        showError(errorElement, 'Name is required');
        return false;
    }
    if (!nameRegex.test(name)) {
        showError(errorElement, 'Name should contain only letters and spaces (2-50 characters)');
        return false;
    }
    
    hideError(errorElement);
    return true;
}

function validateAge(dob) {
    if (!dob) {
        showError(document.getElementById('dob-error'), 'Date of birth is required');
        return false;
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    const errorElement = document.getElementById('dob-error');
    
    if (age < 18) {
        showError(errorElement, 'You must be at least 18 years old');
        return false;
    }
    if (age > 100) {
        showError(errorElement, 'Please enter a valid date of birth');
        return false;
    }
    
    hideError(errorElement);
    return true;
}

function validatePhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    const errorElement = document.getElementById('mobile-error');
    
    if (!phone) {
        showError(errorElement, 'Phone number is required');
        return false;
    }
    if (!phoneRegex.test(phone)) {
        showError(errorElement, 'Please enter a valid 10-digit Indian mobile number');
        return false;
    }
    
    hideError(errorElement);
    return true;
}

function validateLanguage(language) {
    if (!language) {
        showError(document.getElementById('language-error'), 'Please select a language');
        return false;
    }
    return true;
}

// Add validation for step 2
function validateStepTwo() {
    const state = document.getElementById('state').value;
    const district = document.getElementById('district').value;
    const village = document.getElementById('village').value;
    const pincode = document.getElementById('pincode').value;
    
    return validateState(state) && 
           validateDistrict(district) && 
           validateVillage(village) && 
           validatePincode(pincode);
}

// Add validation for step 3
function validateStepThree() {
    const soilType = document.getElementById('soil-type').value;
    const crops = Array.from(document.getElementById('crops').selectedOptions).map(option => option.value);
    const landSize = document.getElementById('land-size').value;
    
    return validateSoilType(soilType) && 
           validateCrops(crops) && 
           validateLandSize(landSize);
}

// Add individual field validation functions
function validateState(state) {
    const errorElement = document.getElementById('state-error');
    if (!state) {
        showError(errorElement, 'Please select a state');
        return false;
    }
    hideError(errorElement);
    return true;
}

function validateDistrict(district) {
    const errorElement = document.getElementById('district-error');
    if (!district) {
        showError(errorElement, 'Please select a district');
        return false;
    }
    hideError(errorElement);
    return true;
}

function validateVillage(village) {
    const errorElement = document.getElementById('village-error');
    if (!village || village.trim().length < 2) {
        showError(errorElement, 'Please enter a valid village/town name');
        return false;
    }
    hideError(errorElement);
    return true;
}

function validatePincode(pincode) {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    const errorElement = document.getElementById('pincode-error');
    
    if (!pincode) {
        showError(errorElement, 'Pincode is required');
        return false;
    }
    if (!pincodeRegex.test(pincode)) {
        showError(errorElement, 'Please enter a valid 6-digit pincode');
        return false;
    }
    hideError(errorElement);
    return true;
}

function validateSoilType(soilType) {
    const errorElement = document.getElementById('soil-type-error');
    if (!soilType) {
        showError(errorElement, 'Please select a soil type');
        return false;
    }
    hideError(errorElement);
    return true;
}

function validateCrops(crops) {
    const errorElement = document.getElementById('crops-error');
    if (!crops || crops.length === 0) {
        showError(errorElement, 'Please select at least one crop');
        return false;
    }
    hideError(errorElement);
    return true;
}

function validateLandSize(landSize) {
    const errorElement = document.getElementById('land-size-error');
    if (!landSize || landSize <= 0) {
        showError(errorElement, 'Please enter a valid land size');
        return false;
    }
    hideError(errorElement);
    return true;
}

// Name editing functionality
async function toggleNameEdit() {
    const nameInput = document.getElementById('name');
    const editButton = document.querySelector('#editNameBtn i');
    
    if (nameInput.readOnly) {
        // Enable editing
        nameInput.readOnly = false;
        nameInput.focus();
        editButton.classList.remove('fa-edit');
        editButton.classList.add('fa-save');
    } else {
        // Save changes
        if (validateName(nameInput.value)) {
            nameInput.readOnly = true;
            editButton.classList.remove('fa-save');
            editButton.classList.add('fa-edit');
            await updateUserName(nameInput.value);
        }
    }
}

// Firebase functions
async function fetchUserName() {
    try {
        const user = window.auth.currentUser;
        if (user) {
            const userRef = doc(window.db, "users", user.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Check both displayName and name fields
                const name = userData.displayName || userData.name || '';
                document.getElementById('name').value = name;
            }
        }
    } catch (error) {
        console.error("Error fetching user name:", error);
        showError(document.getElementById('name-error'), 'Failed to load user name');
    }
}

async function updateUserName(newName) {
    try {
        const user = window.auth.currentUser;
        if (user) {
            const userRef = doc(window.db, "users", user.uid);
            await updateDoc(userRef, {
                displayName: newName,
                name: newName
            });
            showSuccess(document.getElementById('name-error'), 'Name updated successfully');
        }
    } catch (error) {
        console.error("Error updating user name:", error);
        showError(document.getElementById('name-error'), 'Failed to update name');
    }
}

// Utility functions
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function showSuccess(element, message) {
    element.textContent = message;
    element.classList.add('show');
    element.style.color = '#28a745';
    setTimeout(() => hideError(element), 3000);
}

function hideError(element) {
    element.classList.remove('show');
}

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    window.auth.onAuthStateChanged((user) => {
        if (user) {
            fetchUserData(user.uid);
        } else {
            // Redirect to login if not authenticated
            window.location.href = '/index.html';
        }
    });

    // Load states and districts data
    loadStatesAndDistricts();
    
    initializeDatePicker();
    setupEventListeners();
    loadFarmerNotifications();
});

async function fetchUserData(userId) {
    try {
        const userRef = doc(window.db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Wait for states data to be loaded
            if (!statesAndDistricts) {
                await loadStatesAndDistricts();
            }
            
            // Populate all form fields with existing data
            Object.keys(formData).forEach(key => {
                if (userData[key] !== undefined) {
                    formData[key] = userData[key];
                    const element = document.getElementById(key.toLowerCase());
                    if (element) {
                        if (key === 'crops' && Array.isArray(userData[key])) {
                            // Handle multiple select for crops
                            Array.from(element.options).forEach(option => {
                                option.selected = userData[key].includes(option.value);
                            });
                        } else if (key === 'state') {
                            element.value = userData[key];
                            // Populate districts after setting state
                            if (userData[key]) {
                                populateDistricts(userData[key]);
                                // If district is also available, set it after populating districts
                                if (userData.district) {
                                    setTimeout(() => {
                                        const districtSelect = document.getElementById('district');
                                        if (districtSelect) {
                                            districtSelect.value = userData.district;
                                        }
                                    }, 100);
                                }
                            }
                        } else {
                            element.value = userData[key];
                        }
                    }
                }
            });
            
            // Handle profile photo preview if exists
            if (userData.profilePhotoUrl) {
                const preview = document.getElementById('photo-preview');
                preview.src = userData.profilePhotoUrl;
                preview.style.display = 'block';
            }
            
            updateNextButtonState();
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        showError(document.getElementById('name-error'), 'Failed to load user data');
    }
}

// Add geolocation functionality
function getLocation() {
    const statusElement = document.getElementById('coordinates-status');
    const coordinatesInput = document.getElementById('coordinates');
    
    if (!navigator.geolocation) {
        statusElement.textContent = 'Geolocation is not supported by your browser';
        return;
    }
    
    statusElement.innerHTML = '<div class="loading" style="margin-right: 8px;"></div><span>Getting location...</span>';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            coordinatesInput.value = `${latitude}, ${longitude}`;
            formData.coordinates = `${latitude}, ${longitude}`;
            statusElement.textContent = 'Location successfully captured';
            statusElement.style.color = '#28a745';
        },
        (error) => {
            statusElement.textContent = `Error getting location: ${error.message}`;
            statusElement.style.color = '#dc3545';
        }
    );
}

// Add image compression utility function
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const maxWidth = 1024; // Max width for compressed image
        const maxHeight = 1024; // Max height for compressed image
        const maxSizeMB = 5; // Max file size in MB
        
        // Check file size first
        if (file.size > maxSizeMB * 1024 * 1024) {
            reject(new Error(`File size should be less than ${maxSizeMB}MB`));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Get compressed base64 string
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 0.7 quality
                resolve(compressedBase64);
            };
            
            img.onerror = function() {
                reject(new Error('Failed to load image'));
            };
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
    });
}

// Update the handlePhotoUpload function
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('photo-preview');
    const photoError = document.getElementById('photo-error');
    const maxSizeInMB = 5;
    
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError(photoError, 'Please upload an image file');
            return;
        }

        // Validate file size
        if (file.size > maxSizeInMB * 1024 * 1024) {
            showError(photoError, `Image size should be less than ${maxSizeInMB}MB`);
            return;
        }

        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading';
        loadingIndicator.style.margin = '10px 0';
        preview.parentNode.insertBefore(loadingIndicator, preview.nextSibling);

        // Start compression immediately
        compressImage(file)
            .then(compressedBase64 => {
                preview.src = compressedBase64;
                preview.style.display = 'block';
                formData.profilePhotoUrl = compressedBase64;
                loadingIndicator.remove();
                hideError(photoError);
                
                // Log to verify data is being stored
                console.log('Profile photo stored in formData:', formData.profilePhotoUrl.substring(0, 50) + '...');
            })
            .catch(error => {
                showError(photoError, error.message);
                loadingIndicator.remove();
            });
    }
}

// Update the handleLogoFile function
function handleLogoFile(file) {
    const maxSizeInMB = 5;
    const errorElement = document.getElementById('logo-error');
    const dropZone = document.getElementById('logo-drop-zone');
    const previewContainer = document.getElementById('logo-preview-container');
    const logoPreview = document.getElementById('logo-preview');

    // Clear previous errors
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }

    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError('logo-error', 'Please upload an image file');
            return;
        }

        // Validate file size
        if (file.size > maxSizeInMB * 1024 * 1024) {
            showError('logo-error', `Image size should be less than ${maxSizeInMB}MB`);
            return;
        }

        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading';
        loadingIndicator.style.margin = '10px 0';
        dropZone.appendChild(loadingIndicator);

        // Start compression immediately
        compressImage(file)
            .then(compressedBase64 => {
                logoPreview.src = compressedBase64;
                formData.companyLogo = compressedBase64;
                previewContainer.style.display = 'block';
                dropZone.querySelector('p').style.display = 'none';
                dropZone.querySelector('i').style.display = 'none';
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
                loadingIndicator.remove();
            })
            .catch(error => {
                if (errorElement) {
                    errorElement.textContent = error.message;
                    errorElement.style.display = 'block';
                }
                loadingIndicator.remove();
            });
    }
}

// Update the submitForm function
async function submitForm() {
    if (validateStep(3)) {
        try {
            const user = window.auth.currentUser;
            if (user) {
                // Show loading state
                const submitButton = document.querySelector('#step3 button[type="submit"]');
                const originalButtonText = submitButton.innerHTML;
                submitButton.innerHTML = '<div class="loading" style="margin-right: 8px;"></div>Saving...';
                submitButton.disabled = true;

                // First register in users collection
                await registerFarmerInUsers(user.uid, formData);

                const userRef = doc(window.db, "users", user.uid);
                
                // Get existing data
                const userDoc = await getDoc(userRef);
                const existingData = userDoc.exists() ? userDoc.data() : {};
                
                // Prepare updated data
                const updatedData = {
                    ...existingData,
                    ...formData,
                    role: 'farmer',
                    updatedAt: new Date().toISOString(),
                    profileComplete: true
                };

                // Log to verify data before saving
                console.log('Saving profile photo:', updatedData.profilePhotoUrl ? 'Present' : 'Missing');
                
                // Update the document
                await setDoc(userRef, updatedData, { merge: true });
                
                // Also update the farmers collection
                const farmerRef = doc(window.db, "farmers", user.uid);
                await setDoc(farmerRef, {
                    ...updatedData,
                    userId: user.uid,
                    createdAt: new Date().toISOString()
                }, { merge: true });
                
                // Show success message
                showSuccess(document.getElementById('submit-error'), 'Profile updated successfully!');
                
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);

                // Add this after setDoc operations
                const savedDoc = await getDoc(userRef);
                console.log('Saved data:', savedDoc.data());
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            showError(document.getElementById('submit-error'), 'Failed to submit form: ' + error.message);
            
            // Reset submit button
            const submitButton = document.querySelector('#step3 button[type="submit"]');
            submitButton.innerHTML = 'Submit';
            submitButton.disabled = false;
        }
    }
}

// Initialize date picker for DOB field
function initializeDatePicker() {
    // Using flatpickr (already included in your HTML)
    flatpickr("#dob", {
        dateFormat: "Y-m-d",
        maxDate: new Date(), // Can't select future dates
        yearRange: [1923, new Date().getFullYear()], // 100 years range
        defaultDate: formData.dob || null,
        onChange: function(selectedDates, dateStr) {
            formData.dob = dateStr;
            validateAge(dateStr);
        }
    });
}

// Update next button state based on current step validation
function updateNextButtonState() {
    const currentStep = parseInt(document.querySelector('.progress-bar').dataset.step);
    const nextButton = document.querySelector(`#step${currentStep} .btn-primary`);
    
    if (!nextButton) return; // Return if button doesn't exist
    
    let isValid = false;
    
    switch(currentStep) {
        case 1:
            const name = document.getElementById('name').value;
            const dob = document.getElementById('dob').value;
            const mobile = document.getElementById('mobile').value;
            const language = document.getElementById('language').value;
            
            isValid = name && dob && mobile && language;
            break;
            
        case 2:
            const state = document.getElementById('state').value;
            const district = document.getElementById('district').value;
            const village = document.getElementById('village').value;
            const pincode = document.getElementById('pincode').value;
            
            isValid = state && district && village && pincode;
            break;
            
        case 3:
            const soilType = document.getElementById('soil-type').value;
            const crops = Array.from(document.getElementById('crops').selectedOptions).map(option => option.value);
            const landSize = document.getElementById('land-size').value;
            
            isValid = soilType && crops.length > 0 && landSize > 0;
            break;
            
        default:
            isValid = true;
    }
    
    nextButton.disabled = !isValid;
}

// Add event listeners for form fields to update next button state
function setupEventListeners() {
    // Photo upload
    document.getElementById('photo-input').addEventListener('change', handlePhotoUpload);
    
    // State-District dependency
    const stateSelect = document.getElementById('state');
    const districtSelect = document.getElementById('district');
    
    stateSelect.addEventListener('change', function() {
        const selectedState = this.value;
        formData.state = selectedState;
        
        // Reset and disable district select if no state is selected
        if (!selectedState) {
            districtSelect.innerHTML = '<option value="">Select District</option>';
            districtSelect.disabled = true;
            formData.district = '';
        } else {
            populateDistricts(selectedState);
        }
        updateNextButtonState();
    });
    
    districtSelect.addEventListener('change', function() {
        formData.district = this.value;
        updateNextButtonState();
    });
    
    // Get location button
    document.querySelector('.coordinates-group button').addEventListener('click', getLocation);
    
    // Add input event listeners for all form fields
    const formFields = [
        'name', 'dob', 'mobile', 'language', // Step 1
        'state', 'district', 'village', 'pincode', // Step 2
        'soil-type', 'crops', 'land-size' // Step 3
    ];
    
    formFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.addEventListener('input', updateNextButtonState);
            element.addEventListener('change', updateNextButtonState);
        }
    });
}

// Update the populateDistricts function to use the JSON data
function populateDistricts(selectedState) {
    const districtSelect = document.getElementById('district');
    districtSelect.innerHTML = '<option value="">Select District</option>';
    
    if (statesAndDistricts && statesAndDistricts[selectedState]) {
        // Sort districts alphabetically
        const sortedDistricts = statesAndDistricts[selectedState].sort();
        
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
    
    updateNextButtonState();
}

// Make new functions available globally
window.nextStep = nextStep;
window.previousStep = previousStep;
window.toggleNameEdit = toggleNameEdit; 
window.getLocation = getLocation;
window.submitForm = submitForm; 

// Update the registerFarmerInUsers function
async function registerFarmerInUsers(userId, formData) {
    try {
        const userRef = doc(window.db, "users", userId);
        
        // Prepare user data
        const userData = {
            uid: userId,
            email: window.auth.currentUser.email,
            role: 'farmer',
            displayName: formData.name,
            name: formData.name,
            phoneNumber: formData.mobile,
            profilePhotoUrl: formData.profilePhotoUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            profileComplete: true
        };

        // Write to users collection
        await setDoc(userRef, userData, { merge: true });
        
        return true;
    } catch (error) {
        console.error("Error registering farmer in users collection:", error);
        throw error;
    }
}

// Update setupLogoUpload function
function setupLogoUpload() {
    const dropZone = document.getElementById('logo-drop-zone');
    const logoInput = document.getElementById('logo-input');
    const previewContainer = document.getElementById('logo-preview-container');
    const logoPreview = document.getElementById('logo-preview');
    const removeButton = document.getElementById('remove-logo');
    const errorElement = document.createElement('div');
    
    // Add error element if it doesn't exist
    errorElement.id = 'logo-error';
    errorElement.className = 'error-message';
    errorElement.style.display = 'none';
    dropZone.parentNode.insertBefore(errorElement, dropZone.nextSibling);

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
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    });
}

// Add a function to validate the profile photo (optional)
function validateProfilePhoto() {
    const photoUrl = formData.profilePhotoUrl;
    if (!photoUrl) {
        showError(document.getElementById('photo-error'), 'Please upload a profile photo');
        return false;
    }
    return true;
}

// Add this before form submission
console.log('Form Data:', {
    ...formData,
    profilePhotoUrl: formData.profilePhotoUrl ? 'Present' : 'Missing'
}); 

// Fetch and display notifications for the farmer
async function loadFarmerNotifications() {
    const user = window.auth.currentUser;
    if (!user) return;
    const notifSnap = await getDocs(query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid)
    ));
    const notifList = document.getElementById('notificationList');
    if (!notifList) return;
    notifList.innerHTML = '';
    notifSnap.forEach(doc => {
        const n = doc.data();
        const li = document.createElement('li');
        li.textContent = `[${n.type}] ${n.message} (${new Date(n.createdAt).toLocaleString()})`;
        notifList.appendChild(li);
    });
}

// Fetch and display only available stubble
async function loadMyStubble() {
    const user = window.auth.currentUser;
    if (!user) return;
    const stubbleSnap = await getDocs(query(
        collection(db, 'stubble_listings'),
        where('farmerId', '==', user.uid),
        where('available', '==', true)
    ));
    // ... render logic ...
} 