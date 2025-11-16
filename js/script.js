// Global Variables
let currentStep = 1;
const totalSteps = 8;

// Google Apps Script Web App URL (Replace with your deployed URL)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyrQa4J7rebGDu2uRmoCLS4Frho6bHvEmJWSm6YfugwqiHu9UYQtEd8WDjh6irslohp/exec';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    loadFromLocalStorage();
    updateProgress();
});

// Initialize Form
function initializeForm() {
    showStep(currentStep);
    setupMultiSelect();
    setupSliders();
    setupCharCounters();
    setupSearchableMultiSelect();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    document.getElementById('prevBtn').addEventListener('click', prevStep);
    document.getElementById('careerForm').addEventListener('submit', handleSubmit);
    
    // Clear button
    document.getElementById('clearBtn').addEventListener('click', clearForm);
    
    // Auto-save to localStorage on input change
    document.getElementById('careerForm').addEventListener('input', debounce(saveToLocalStorage, 500));
    
    // Calculate academic consistency when grades change
    ['class10', 'class12', 'ugCGPA', 'gradCGPA', 'pgCGPA'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculateAcademicConsistency);
        }
    });
    
    // Update skill embedding when skills change
    document.querySelectorAll('input[name="technicalSkills"], input[name="softSkills"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSkillEmbedding);
    });
    
    // Handle current status change
    const currentStatusSelect = document.getElementById('currentStatus');
    if (currentStatusSelect) {
        currentStatusSelect.addEventListener('change', handleCurrentStatusChange);
    }
}

// Multi-Select Dropdown Setup
function setupMultiSelect() {
    const multiSelects = document.querySelectorAll('.multi-select');
    
    multiSelects.forEach(select => {
        const header = select.querySelector('.multi-select-header');
        if (header) {
            header.addEventListener('click', function() {
                select.classList.toggle('active');
            });
        }
        
        const checkboxes = select.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateMultiSelectText(select);
            });
        });
    });
    
    // Close multi-select when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.multi-select')) {
            multiSelects.forEach(select => {
                select.classList.remove('active');
            });
        }
    });
}

// Update Multi-Select Display Text
function updateMultiSelectText(selectElement) {
    const header = selectElement.querySelector('.multi-select-header');
    if (!header) return;
    
    const textElement = header.querySelector('.multi-select-text');
    const checkboxes = selectElement.querySelectorAll('input[type="checkbox"]:checked');
    const selectedCount = checkboxes.length;
    
    if (selectedCount === 0) {
        const name = selectElement.id.replace('Select', '');
        textElement.textContent = `Select ${name}...`;
        textElement.style.color = '#666';
    } else {
        textElement.textContent = `${selectedCount} selected`;
        textElement.style.color = '#333';
    }
}

// Setup Searchable Multi-Select
function setupSearchableMultiSelect() {
    // Technical Skills Search
    setupSearch('techSkillSearch', 'technicalSkillsSelect');
    
    // Experience Types Search
    setupSearch('experienceTypesSearch', 'experienceTypesSelect');
    
    // Work Preference Search
    setupSearch('workPreferenceSearch', 'workPreferenceSelect');
    
    // Preferred Industries Search
    setupSearch('preferredIndustriesSearch', 'preferredIndustriesSelect');
    
    // Preferred Roles Search
    setupSearch('preferredRolesSearch', 'preferredRolesSelect');
    
    // Current Job Role Search
    setupSearch('currentJobRoleSearch', 'currentJobRoleSelect');
}

// Handle Current Status Change
function handleCurrentStatusChange() {
    const currentStatus = document.getElementById('currentStatus').value;
    const currentJobRoleGroup = document.getElementById('currentJobRoleGroup');
    const currentJobRoleRadios = document.querySelectorAll('input[name="currentJobRole"]');
    
    if (currentStatus === 'working') {
        currentJobRoleGroup.style.display = 'block';
        // Make job role required when working
        currentJobRoleRadios.forEach(radio => {
            radio.setAttribute('data-conditionally-required', 'true');
        });
    } else {
        currentJobRoleGroup.style.display = 'none';
        // Remove required when student
        currentJobRoleRadios.forEach(radio => {
            radio.removeAttribute('data-conditionally-required');
            radio.checked = false;
        });
    }
}

// Setup Search Functionality
function setupSearch(searchInputId, containerSelectId) {
    const searchInput = document.getElementById(searchInputId);
    const skillsContainer = document.getElementById(containerSelectId);
    
    if (!searchInput || !skillsContainer) return;
    
    const allLabels = skillsContainer.querySelectorAll('label');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        allLabels.forEach(label => {
            const skillName = label.textContent.toLowerCase();
            if (skillName.includes(searchTerm)) {
                label.style.display = 'block';
            } else {
                label.style.display = 'none';
            }
        });
    });
}

// Setup Range Sliders
function setupSliders() {
    const sliders = [
        'techProficiency', 'softProficiency', 'courseDifficulty', 
        'projectComplexity', 'interestSTEM', 'interestBusiness', 
        'interestArts', 'interestDesign', 'interestMedical', 
        'interestSocialScience', 'conscientiousness', 'extraversion', 
        'openness', 'agreeableness', 'emotionalStability'
    ];
    
    sliders.forEach(id => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(id + 'Value');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', function() {
                valueDisplay.textContent = this.value;
            });
        }
    });
}

// Setup Character Counters
function setupCharCounters() {
    const textareas = [
        { id: 'courseKeywords', counterId: 'courseKeywordsCount' },
        { id: 'projectKeywords', counterId: 'projectKeywordsCount' },
        { id: 'workKeywords', counterId: 'workKeywordsCount' }
    ];
    
    textareas.forEach(({ id, counterId }) => {
        const textarea = document.getElementById(id);
        const counter = document.getElementById(counterId);
        
        if (textarea && counter) {
            textarea.addEventListener('input', function() {
                counter.textContent = this.value.length;
            });
        }
    });
}

// Navigation Functions
function nextStep() {
    if (validateStep(currentStep)) {
        currentStep++;
        showStep(currentStep);
        updateProgress();
        saveToLocalStorage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevStep() {
    currentStep--;
    showStep(currentStep);
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStep(step) {
    const steps = document.querySelectorAll('.form-step');
    steps.forEach((stepElement, index) => {
        stepElement.classList.remove('active');
        if (index + 1 === step) {
            stepElement.classList.add('active');
        }
    });
    
    // Update button visibility
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.style.display = step === 1 ? 'none' : 'inline-flex';
    nextBtn.style.display = step === totalSteps ? 'none' : 'inline-flex';
    submitBtn.style.display = step === totalSteps ? 'inline-flex' : 'none';
}

function updateProgress() {
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = `Step ${currentStep} of ${totalSteps}`;
}

// Validation
function validateStep(step) {
    const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    const requiredInputs = currentStepElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredInputs.forEach(input => {
        if (input.type === 'checkbox') {
            const checkboxGroup = currentStepElement.querySelectorAll(`input[name="${input.name}"]`);
            const isChecked = Array.from(checkboxGroup).some(cb => cb.checked);
            if (!isChecked) {
                isValid = false;
                showValidationError(input, 'Please select at least one option');
            }
        } else if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = '#e74c3c';
            showValidationError(input, 'This field is required');
        } else {
            input.style.borderColor = '#e0e0e0';
        }
    });
    
    // Check conditionally required fields (current job role when working)
    const currentStatus = document.getElementById('currentStatus');
    if (currentStatus && currentStatus.value === 'working') {
        const jobRoleRadios = document.querySelectorAll('input[name="currentJobRole"]');
        const isJobRoleSelected = Array.from(jobRoleRadios).some(radio => radio.checked);
        
        if (!isJobRoleSelected) {
            isValid = false;
            const jobRoleGroup = document.getElementById('currentJobRoleGroup');
            if (jobRoleGroup) {
                showValidationError(jobRoleGroup.querySelector('label'), 'Please select your current job role');
            }
        }
    }
    
    if (!isValid) {
        alert('Please fill in all required fields before proceeding.');
    }
    
    return isValid;
}

function showValidationError(input, message) {
    input.style.borderColor = '#e74c3c';
    
    // Remove existing error message if any
    const existingError = input.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    input.parentElement.appendChild(errorDiv);
    
    // Remove error on input
    input.addEventListener('input', function removeError() {
        input.style.borderColor = '#e0e0e0';
        const error = input.parentElement.querySelector('.error-message');
        if (error) error.remove();
        input.removeEventListener('input', removeError);
    }, { once: true });
}

// Calculate Academic Consistency
function calculateAcademicConsistency() {
    const class10 = parseFloat(document.getElementById('class10').value) || 0;
    const class12 = parseFloat(document.getElementById('class12').value) || 0;
    const ugCGPA = parseFloat(document.getElementById('ugCGPA').value) || 0;
    const gradCGPA = parseFloat(document.getElementById('gradCGPA').value) || 0;
    const pgCGPA = parseFloat(document.getElementById('pgCGPA').value) || 0;
    
    // Normalize scores to 0-1 scale
    const scores = [
        class10 / 100,
        class12 / 100,
        ugCGPA > 0 ? ugCGPA / 10 : null,
        gradCGPA > 0 ? gradCGPA / 10 : null,
        pgCGPA > 0 ? pgCGPA / 10 : null
    ].filter(score => score !== null && score > 0);
    
    if (scores.length < 2) {
        document.getElementById('academicConsistency').value = '';
        return;
    }
    
    // Calculate standard deviation
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consistency score (inverse of coefficient of variation, capped at 1)
    const consistency = Math.max(0, Math.min(1, 1 - (stdDev / mean)));
    
    document.getElementById('academicConsistency').value = consistency.toFixed(2);
}

// Update Skill Embedding
function updateSkillEmbedding() {
    const technicalSkills = Array.from(document.querySelectorAll('input[name="technicalSkills"]:checked'))
        .map(cb => cb.value);
    const softSkills = Array.from(document.querySelectorAll('input[name="softSkills"]:checked'))
        .map(cb => cb.value);
    
    const allSkills = [...technicalSkills, ...softSkills];
    document.getElementById('skillEmbedding').value = allSkills.join(', ');
}

// Local Storage Functions
function saveToLocalStorage() {
    const formData = collectFormData();
    localStorage.setItem('careerFormData', JSON.stringify(formData));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('careerFormData');
    if (savedData) {
        try {
            const formData = JSON.parse(savedData);
            populateForm(formData);
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

function populateForm(data) {
    // Populate text, number, and select fields
    Object.keys(data).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = data[key];
            } else if (element.type === 'range') {
                element.value = data[key];
                const valueDisplay = document.getElementById(key + 'Value');
                if (valueDisplay) valueDisplay.textContent = data[key];
            } else {
                element.value = data[key];
            }
        }
    });
    
    // Populate checkboxes for multi-select fields
    ['languages', 'technicalSkills', 'softSkills', 'experienceTypes', 'workPreference', 'preferredIndustries', 'preferredRoles'].forEach(name => {
        if (data[name] && Array.isArray(data[name])) {
            data[name].forEach(value => {
                const checkbox = document.querySelector(`input[name="${name}"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
            
            // Update multi-select display
            const selectElement = document.getElementById(name + 'Select');
            if (selectElement) {
                updateMultiSelectText(selectElement);
            }
        }
    });
    
    // Populate radio button for current job role
    if (data.current_job_role && data.current_status === 'working') {
        const radio = document.querySelector(`input[name="currentJobRole"][value="${data.current_job_role}"]`);
        if (radio) radio.checked = true;
    }
    
    // Trigger current status change to show/hide job role field
    if (data.current_status) {
        handleCurrentStatusChange();
    }
    
    // Update calculated fields
    calculateAcademicConsistency();
    updateSkillEmbedding();
}

// Collect Form Data
function collectFormData() {
    const formData = {
        user_id: generateUUID(),
        timestamp: new Date().toISOString(),
        
        // Step 1: Personal Information
        age: parseInt(document.getElementById('age').value) || 0,
        gender: document.getElementById('gender').value,
        location: document.getElementById('location').value,
        languages: getCheckedValues('languages'),
        
        // Step 2: Academic Performance
        class10_percentage: parseFloat(document.getElementById('class10').value) || 0,
        class12_percentage: parseFloat(document.getElementById('class12').value) || 0,
        class12_stream: document.getElementById('class12Stream').value,
        ug_major: document.getElementById('ugMajor').value || '',
        ug_cgpa: parseFloat(document.getElementById('ugCGPA').value) || 0,
        grad_major: document.getElementById('gradMajor').value || '',
        grad_cgpa: parseFloat(document.getElementById('gradCGPA').value) || 0,
        pg_major: document.getElementById('pgMajor').value || '',
        pg_cgpa: parseFloat(document.getElementById('pgCGPA').value) || 0,
        highest_education: document.getElementById('highestEducation').value,
        standardized_test_score: parseFloat(document.getElementById('standardizedTest').value) || 0,
        academic_consistency: parseFloat(document.getElementById('academicConsistency').value) || 0,
        
        // Step 3: Technical & Soft Skills
        technical_skills: getCheckedValues('technicalSkills'),
        tech_skill_proficiency: parseFloat(document.getElementById('techProficiency').value) || 0,
        soft_skills: getCheckedValues('softSkills'),
        soft_skill_proficiency: parseFloat(document.getElementById('softProficiency').value) || 0,
        skill_embedding: document.getElementById('skillEmbedding').value,
        
        // Step 4: Learning & Development
        courses_completed: parseInt(document.getElementById('coursesCompleted').value) || 0,
        avg_course_difficulty: parseFloat(document.getElementById('courseDifficulty').value) || 0,
        total_hours_learning: parseFloat(document.getElementById('hoursLearning').value) || 0,
        course_keywords: document.getElementById('courseKeywords').value,
        
        // Step 5: Projects
        project_count: parseInt(document.getElementById('projectCount').value) || 0,
        avg_project_complexity: parseFloat(document.getElementById('projectComplexity').value) || 0,
        project_keywords: document.getElementById('projectKeywords').value,
        
        // Step 6: Work Experience
        experience_months: parseInt(document.getElementById('experienceMonths').value) || 0,
        experience_types: getCheckedValues('experienceTypes'),
        job_level: document.getElementById('jobLevel').value,
        work_keywords: document.getElementById('workKeywords').value,
        
        // Step 7: Interests & Preferences
        interest_stem: parseFloat(document.getElementById('interestSTEM').value) || 0,
        interest_business: parseFloat(document.getElementById('interestBusiness').value) || 0,
        interest_arts: parseFloat(document.getElementById('interestArts').value) || 0,
        interest_design: parseFloat(document.getElementById('interestDesign').value) || 0,
        interest_medical: parseFloat(document.getElementById('interestMedical').value) || 0,
        interest_social_science: parseFloat(document.getElementById('interestSocialScience').value) || 0,
        career_preference: document.getElementById('careerPreference').value,
        work_preference: getCheckedValues('workPreference'),
        preferred_industries: getCheckedValues('preferredIndustries'),
        preferred_roles: getCheckedValues('preferredRoles'),
        
        // Step 8: Personality Assessment
        conscientiousness: parseInt(document.getElementById('conscientiousness').value) || 0,
        extraversion: parseInt(document.getElementById('extraversion').value) || 0,
        openness: parseInt(document.getElementById('openness').value) || 0,
        agreeableness: parseInt(document.getElementById('agreeableness').value) || 0,
        emotional_stability: parseInt(document.getElementById('emotionalStability').value) || 0,
        
        // Current Status and Job Role (Label for dataset)
        current_status: document.getElementById('currentStatus').value || '',
        current_job_role: document.getElementById('currentStatus').value === 'student' ? 'Student' : getSelectedRadioValue('currentJobRole')
    };
    
    return formData;
}

// Helper Functions
function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
        .map(cb => cb.value);
}

function getSelectedRadioValue(name) {
    const selectedRadio = document.querySelector(`input[name="${name}"]:checked`);
    return selectedRadio ? selectedRadio.value : '';
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Form Submission
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
        return;
    }
    
    const formData = collectFormData();
    
    // Show loading modal
    showLoadingModal();
    
    try {
        // Submit to Google Sheets
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        // Since mode is 'no-cors', we won't get response details
        // Assume success after a short delay
        setTimeout(() => {
            hideLoadingModal();
            showSuccessModal();
            clearLocalStorage();
        }, 2000);
        
    } catch (error) {
        console.error('Submission error:', error);
        hideLoadingModal();
        showErrorModal('Failed to submit form. Please try again.');
    }
}

// Clear Form
function clearForm() {
    if (confirm('Are you sure you want to clear all form data? This cannot be undone.')) {
        document.getElementById('careerForm').reset();
        
        // Reset all sliders
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            const valueDisplay = document.getElementById(slider.id + 'Value');
            if (valueDisplay) {
                valueDisplay.textContent = slider.value;
            }
        });
        
        // Reset multi-select displays
        const multiSelects = document.querySelectorAll('.multi-select');
        multiSelects.forEach(select => {
            updateMultiSelectText(select);
        });
        
        // Clear localStorage
        clearLocalStorage();
        
        // Go back to step 1
        currentStep = 1;
        showStep(currentStep);
        updateProgress();
    }
}

function clearLocalStorage() {
    localStorage.removeItem('careerFormData');
}

// Modal Functions
function showLoadingModal() {
    document.getElementById('loadingModal').classList.add('show');
}

function hideLoadingModal() {
    document.getElementById('loadingModal').classList.remove('show');
}

function showSuccessModal() {
    document.getElementById('successModal').classList.add('show');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('show');
    // Reset form after success
    clearForm();
}

function showErrorModal(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').classList.add('show');
}

function closeErrorModal() {
    document.getElementById('errorModal').classList.remove('show');
}

// Make modal close functions global
window.closeSuccessModal = closeSuccessModal;
window.closeErrorModal = closeErrorModal;