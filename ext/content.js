/**
 * Content script - runs on web pages to detect and fill forms
 */

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fillForm') {
    const cvData = request.cvData;
    const options = request.options || {};
    
    // Try to detect and fill SOLID.jobs form
    const solidJobsDetected = detectSolidJobsForm();
    
    // Try to detect Traffit form
    const traffitDetected = detectTraffitForm();
    
    // Try to detect eRecruiter form
    const eRecruiterDetected = detectERecruiterForm();
    
    if (solidJobsDetected) {
      // Handle async fill function
      fillSolidJobsForm(cvData, options).then(success => {
        sendResponse({ 
          success: success, 
          message: success ? 'Formularz wypełniony pomyślnie!' : 'Nie udało się wypełnić formularza.',
          formType: 'SOLID.jobs'
        });
      }).catch(error => {
        console.error('Error filling form:', error);
        sendResponse({ 
          success: false, 
          message: 'Błąd podczas wypełniania: ' + error.message,
          formType: 'SOLID.jobs'
        });
      });
    } else if (traffitDetected) {
      // Handle Traffit form
      fillTraffitForm(cvData, options).then(success => {
        sendResponse({ 
          success: success, 
          message: success ? 'Formularz Traffit wypełniony pomyślnie!' : 'Nie udało się wypełnić formularza.',
          formType: 'Traffit'
        });
      }).catch(error => {
        console.error('Error filling Traffit form:', error);
        sendResponse({ 
          success: false, 
          message: 'Błąd podczas wypełniania: ' + error.message,
          formType: 'Traffit'
        });
      });
    } else if (eRecruiterDetected) {
      // Handle eRecruiter form
      fillERecruiterForm(cvData, options).then(success => {
        sendResponse({ 
          success: success, 
          message: success ? 'Formularz eRecruiter wypełniony pomyślnie!' : 'Nie udało się wypełnić formularza.',
          formType: 'eRecruiter'
        });
      }).catch(error => {
        console.error('Error filling eRecruiter form:', error);
        sendResponse({ 
          success: false, 
          message: 'Błąd podczas wypełniania: ' + error.message,
          formType: 'eRecruiter'
        });
      });
    } else {
      sendResponse({ 
        success: false, 
        message: 'Nie znaleziono wspieranego formularza na tej stronie.',
        formType: 'unknown'
      });
    }
    
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'detectForm') {
    // Detect what kind of form is on the page
    const solidJobsDetected = detectSolidJobsForm();
    const traffitDetected = detectTraffitForm();
    const eRecruiterDetected = detectERecruiterForm();
    
    if (solidJobsDetected) {
      sendResponse({
        detected: true,
        formType: 'SOLID.jobs',
        url: window.location.href
      });
    } else if (traffitDetected) {
      sendResponse({
        detected: true,
        formType: 'Traffit',
        url: window.location.href
      });
    } else if (eRecruiterDetected) {
      sendResponse({
        detected: true,
        formType: 'eRecruiter',
        url: window.location.href
      });
    } else {
      sendResponse({
        detected: false,
        formType: 'unknown',
        url: window.location.href
      });
    }
    
    return true;
  }
});

// Notify popup when page loads with a supported form
window.addEventListener('load', () => {
  const solidJobsDetected = detectSolidJobsForm();
  const traffitDetected = detectTraffitForm();
  const eRecruiterDetected = detectERecruiterForm();
  
  if (solidJobsDetected) {
    chrome.runtime.sendMessage({
      action: 'formDetected',
      formType: 'SOLID.jobs',
      url: window.location.href
    });
  } else if (traffitDetected) {
    chrome.runtime.sendMessage({
      action: 'formDetected',
      formType: 'Traffit',
      url: window.location.href
    });
  } else if (eRecruiterDetected) {
    chrome.runtime.sendMessage({
      action: 'formDetected',
      formType: 'eRecruiter',
      url: window.location.href
    });
  }
});

// Add visual indicator when form is detected
function addFormDetectionIndicator() {
  const solidJobsDetected = detectSolidJobsForm();
  const traffitDetected = detectTraffitForm();
  const eRecruiterDetected = detectERecruiterForm();
  
  let formType = null;
  if (solidJobsDetected) formType = 'SOLID.jobs';
  else if (traffitDetected) formType = 'Traffit';
  else if (eRecruiterDetected) formType = 'eRecruiter';
  
  if (formType) {
    const indicator = document.createElement('div');
    indicator.id = 'cv-autofill-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
      ">
        ✓ Formularz ${formType} wykryty - użyj rozszerzenia CV AutoFill
      </div>
    `;
    document.body.appendChild(indicator);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      indicator.style.transition = 'opacity 0.5s';
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 500);
    }, 5000);
  }
}

// Add indicator when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addFormDetectionIndicator);
} else {
  addFormDetectionIndicator();
}
