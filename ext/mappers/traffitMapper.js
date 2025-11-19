/**
 * Mapper for Traffit application forms (billennium.traffit.com)
 * Browser extension compatible version
 */

/**
 * Maps CV data to Traffit form fields
 * @param {Object} cvData - CV data in JSON Resume format
 * @param {Object} options - Additional options for the application
 * @returns {Object} Mapped form data
 */
function mapCVToTraffitForm(cvData, options = {}) {
  const basics = cvData.basics || {};
  
  // Split name into first and last name
  const nameParts = (basics.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Get LinkedIn URL
  const linkedInProfile = basics.profiles?.find(p => 
    p.network?.toLowerCase() === 'linkedin'
  );
  
  const formData = {
    firstName: firstName,
    lastName: lastName,
    email: basics.email || '',
    phone: basics.phone || '',
    linkedInUrl: linkedInProfile?.url || '',
    salaryExpectations: options.expectedSalary || '',
    availability: options.availabilityDate || 'Natychmiast',
    agreeToDataProcessing: true,
    agreeToFutureRecruitment: options.agreeToFutureRecruitment !== undefined ? options.agreeToFutureRecruitment : true,
  };
  
  return formData;
}

/**
 * Detects Traffit form and returns field selectors
 */
function detectTraffitForm() {
  // Check if we're on a traffit.com domain
  if (!window.location.hostname.includes('traffit.com')) {
    return null;
  }
  
  // Look for the main form
  const form = document.querySelector('form');
  if (!form) return null;
  
  // Helper to find input by label text
  const findInputByLabel = (labelTexts) => {
    for (const text of labelTexts) {
      const labels = Array.from(document.querySelectorAll('label'));
      const label = labels.find(l => 
        l.textContent.toLowerCase().trim().includes(text.toLowerCase())
      );
      if (label) {
        const forAttr = label.getAttribute('for');
        if (forAttr) {
          return document.querySelector(`#${forAttr}`);
        }
        // Try to find input near the label
        const parent = label.closest('div, fieldset');
        if (parent) {
          const input = parent.querySelector('input, textarea, select');
          if (input) return input;
        }
      }
    }
    return null;
  };
  
  return {
    form: form,
    fields: {
      firstName: findInputByLabel(['imię', 'first name', 'name']) || 
                 form.querySelector('input[name*="first" i], input[name*="imie" i]'),
      lastName: findInputByLabel(['nazwisko', 'last name', 'surname']) ||
                form.querySelector('input[name*="last" i], input[name*="nazwisko" i]'),
      email: findInputByLabel(['email', 'e-mail']) ||
             form.querySelector('input[type="email"], input[name*="email" i]'),
      phone: findInputByLabel(['telefon', 'phone', 'numer']) ||
             form.querySelector('input[type="tel"], input[name*="phone" i], input[name*="telefon" i]'),
      linkedInUrl: findInputByLabel(['linkedin', 'linked in', 'profil']) ||
                   form.querySelector('input[name*="linkedin" i], input[placeholder*="linkedin" i]'),
      salaryExpectations: findInputByLabel(['salary', 'wynagrodzeni', 'expectations']) ||
                         form.querySelector('input[name*="salary" i], input[name*="expectations" i]'),
      availability: findInputByLabel(['availability', 'dostępn', 'available']) ||
                   form.querySelector('input[name*="availability" i], input[name*="available" i]'),
      cvFile: form.querySelector('input[type="file"]'),
      // Checkboxes
      dataProcessingConsent: Array.from(form.querySelectorAll('input[type="checkbox"]')).find(cb => {
        const label = cb.closest('label') || document.querySelector(`label[for="${cb.id}"]`);
        return label && label.textContent.toLowerCase().includes('personal data');
      }),
      futureRecruitmentConsent: Array.from(form.querySelectorAll('input[type="checkbox"]')).find(cb => {
        const label = cb.closest('label') || document.querySelector(`label[for="${cb.id}"]`);
        return label && label.textContent.toLowerCase().includes('further recruitment');
      }),
    }
  };
}

/**
 * Fills the Traffit form with CV data
 */
async function fillTraffitForm(cvData, options = {}) {
  const detected = detectTraffitForm();
  if (!detected) {
    console.log('Traffit form not found on this page');
    return false;
  }
  
  const formData = mapCVToTraffitForm(cvData, options);
  const fields = detected.fields;
  
  console.log('Filling Traffit form with data:', formData);
  console.log('Detected fields:', fields);
  
  // Helper to add delay
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Helper to set input value
  const setInputValue = async (element, value, fieldName) => {
    if (!element || !value) {
      if (!element) console.log(`Field ${fieldName} not found`);
      if (!value) console.log(`No value for ${fieldName}`);
      return false;
    }
    
    console.log(`Setting ${fieldName} to:`, value);
    
    element.focus();
    await delay(50);
    
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await delay(50);
    
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await delay(50);
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await delay(50);
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    await delay(50);
    
    return true;
  };
  
  let filledCount = 0;
  
  // Fill basic fields
  if (await setInputValue(fields.firstName, formData.firstName, 'firstName')) filledCount++;
  if (await setInputValue(fields.lastName, formData.lastName, 'lastName')) filledCount++;
  if (await setInputValue(fields.email, formData.email, 'email')) filledCount++;
  if (await setInputValue(fields.phone, formData.phone, 'phone')) filledCount++;
  if (await setInputValue(fields.linkedInUrl, formData.linkedInUrl, 'linkedInUrl')) filledCount++;
  if (await setInputValue(fields.salaryExpectations, formData.salaryExpectations, 'salaryExpectations')) filledCount++;
  if (await setInputValue(fields.availability, formData.availability, 'availability')) filledCount++;
  
  // Check consent checkboxes
  if (fields.dataProcessingConsent && !fields.dataProcessingConsent.checked) {
    fields.dataProcessingConsent.click();
    await delay(50);
    console.log('Checked data processing consent');
    filledCount++;
  }
  
  if (fields.futureRecruitmentConsent && formData.agreeToFutureRecruitment && !fields.futureRecruitmentConsent.checked) {
    fields.futureRecruitmentConsent.click();
    await delay(50);
    console.log('Checked future recruitment consent');
    filledCount++;
  }
  
  console.log(`Traffit form filled successfully - ${filledCount} fields updated`);
  
  // Note about CV file upload
  if (fields.cvFile) {
    console.log('Note: CV file upload field detected but must be filled manually');
  }
  
  return filledCount > 0;
}
