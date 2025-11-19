/**
 * Mapper for SOLID.jobs application forms
 * Maps CV JSON data to form fields for job applications on solid.jobs
 */

/**
 * Maps CV data to SOLID.jobs form fields
 * @param {Object} cvData - CV data in JSON Resume format
 * @param {Object} options - Additional options for the application
 * @returns {Object} Mapped form data
 */
function mapCVToSolidJobsForm(cvData, options = {}) {
  const basics = cvData.basics || {};
  const work = cvData.work || [];
  const skills = cvData.skills || [];
  
  // Helper function to get skill names
  const getSkillNames = () => {
    return skills.map(s => s.name).filter(Boolean);
  };
  
  // Helper function to format experience years
  const calculateExperienceYears = () => {
    if (work.length === 0) return 0;
    
    const sortedWork = [...work].sort((a, b) => {
      const dateA = new Date(a.startDate || '2000-01-01');
      const dateB = new Date(b.startDate || '2000-01-01');
      return dateA - dateB;
    });
    
    const firstJob = new Date(sortedWork[0].startDate || '2000-01-01');
    const now = new Date();
    const years = Math.floor((now - firstJob) / (1000 * 60 * 60 * 24 * 365.25));
    return years;
  };
  
  // Helper function to format LinkedIn URL
  const getLinkedInUrl = () => {
    const linkedInProfile = basics.profiles?.find(p => 
      p.network?.toLowerCase() === 'linkedin'
    );
    return linkedInProfile?.url || '';
  };
  
  // Build the form data mapping
  const formData = {
    // Basic personal information
    fullName: basics.name || '',
    email: basics.email || '',
    phone: basics.phone || '',
    
    // Employment preferences
    employmentType: options.employmentType || 'B2B',
    
    // Salary expectations
    expectedSalary: options.expectedSalary || '',
    salaryCurrency: options.salaryCurrency || 'PLN netto',
    
    // Availability
    availabilityDate: options.availabilityDate || 'Natychmiast', // "Immediately" in Polish
    noticePeriod: options.noticePeriod || '1 miesiąc', // "1 month" in Polish
    
    // Location preferences
    location: basics.location?.address || basics.location?.city || 'Poland',
    remoteWork: options.remoteWork !== undefined ? options.remoteWork : true,
    
    // CV and cover letter
    cvText: formatCVText(cvData),
    coverLetter: options.coverLetter || '',
    
    // LinkedIn profile
    linkedInUrl: getLinkedInUrl(),
    
    // Portfolio/Website
    portfolioUrl: basics.url || '',
    
    // Skills
    skills: getSkillNames().join(', '),
    
    // Experience summary
    experienceYears: calculateExperienceYears(),
    
    // Consent and legal
    acceptCookiesPolicy: options.acceptCookiesPolicy !== undefined ? options.acceptCookiesPolicy : true,
    agreeToDataProcessing: options.agreeToDataProcessing !== undefined ? options.agreeToDataProcessing : true,
    consentForRecruitmentDataHandling: true,
    
    // Additional information
    additionalInfo: options.additionalInfo || '',
  };
  
  return formData;
}

/**
 * Formats CV data as plain text for textarea fields
 * @param {Object} cvData - CV data in JSON Resume format
 * @returns {string} Formatted CV text
 */
function formatCVText(cvData) {
  const basics = cvData.basics || {};
  const work = cvData.work || [];
  const education = cvData.education || [];
  const skills = cvData.skills || [];
  
  let cvText = '';
  
  // Header
  cvText += `${basics.name}\n`;
  if (basics.label) cvText += `${basics.label}\n`;
  cvText += `\n`;
  
  // Contact
  if (basics.email) cvText += `Email: ${basics.email}\n`;
  if (basics.phone) cvText += `Phone: ${basics.phone}\n`;
  if (basics.url) cvText += `Website: ${basics.url}\n`;
  
  const linkedIn = basics.profiles?.find(p => p.network?.toLowerCase() === 'linkedin');
  if (linkedIn?.url) cvText += `LinkedIn: ${linkedIn.url}\n`;
  cvText += `\n`;
  
  // Summary
  if (basics.summary) {
    cvText += `SUMMARY\n`;
    cvText += `${basics.summary}\n\n`;
  }
  
  // Work Experience
  if (work.length > 0) {
    cvText += `WORK EXPERIENCE\n`;
    work.forEach(job => {
      cvText += `\n${job.position || 'Position'} at ${job.name || 'Company'}\n`;
      const startDate = job.startDate ? new Date(job.startDate).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' }) : '';
      const endDate = job.endDate ? new Date(job.endDate).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' }) : 'Present';
      cvText += `${startDate} - ${endDate}\n`;
      if (job.location) cvText += `${job.location}\n`;
      if (job.summary) cvText += `${job.summary}\n`;
      if (job.highlights && job.highlights.length > 0) {
        job.highlights.forEach(h => cvText += `• ${h}\n`);
      }
    });
    cvText += `\n`;
  }
  
  // Education
  if (education.length > 0) {
    cvText += `EDUCATION\n`;
    education.forEach(edu => {
      cvText += `\n${edu.studyType || 'Degree'} in ${edu.area || 'Field'}\n`;
      cvText += `${edu.institution || 'Institution'}\n`;
      const startYear = edu.startDate ? new Date(edu.startDate).getFullYear() : '';
      const endYear = edu.endDate ? new Date(edu.endDate).getFullYear() : '';
      if (startYear || endYear) cvText += `${startYear} - ${endYear}\n`;
    });
    cvText += `\n`;
  }
  
  // Skills
  if (skills.length > 0) {
    cvText += `SKILLS\n`;
    skills.forEach(skillGroup => {
      if (skillGroup.name) {
        cvText += `${skillGroup.name}: `;
        if (skillGroup.keywords && skillGroup.keywords.length > 0) {
          cvText += skillGroup.keywords.join(', ');
        }
        cvText += `\n`;
      }
    });
    cvText += `\n`;
  }
  
  // Languages
  if (cvData.languages && cvData.languages.length > 0) {
    cvText += `LANGUAGES\n`;
    cvData.languages.forEach(lang => {
      cvText += `${lang.language || ''} - ${lang.fluency || ''}\n`;
    });
  }
  
  return cvText;
}

/**
 * Gets field selectors for the SOLID.jobs enrollForm
 * These selectors are based on common patterns in SOLID.jobs forms
 * @returns {Object} Object containing CSS selectors for each form field
 */
function getSolidJobsFormSelectors() {
  return {
    form: '#enrollForm',
    
    // Basic fields - adjust these selectors based on actual form structure
    fullName: 'input[name="fullName"], input[placeholder*="imię"], input[placeholder*="nazwisko"]',
    email: 'input[name="email"], input[type="email"], input[placeholder*="e-mail"]',
    phone: 'input[name="phone"], input[type="tel"], input[placeholder*="telefon"]',
    
    // Employment
    employmentType: 'select[name="employmentType"], input[name="employmentType"]',
    
    // Salary
    expectedSalary: 'input[name="expectedSalary"], input[name="salary"], input[placeholder*="wynagrodzeni"]',
    salaryCurrency: 'select[name="currency"], select[name="salaryCurrency"]',
    
    // Availability
    availabilityDate: 'input[name="availabilityDate"], input[name="startDate"], input[placeholder*="zacząć"]',
    
    // CV upload or textarea
    cvFile: 'input[type="file"][name*="cv"], input[type="file"][accept*="pdf"]',
    cvText: 'textarea[name="cv"], textarea[name="resume"]',
    
    // Cover letter
    coverLetter: 'textarea[name="coverLetter"], textarea[name="motivationLetter"], textarea[placeholder*="list motywacyjny"]',
    
    // URLs
    linkedInUrl: 'input[name="linkedIn"], input[name="linkedin"], input[placeholder*="LinkedIn"]',
    portfolioUrl: 'input[name="portfolio"], input[name="website"], input[placeholder*="portfolio"]',
    
    // Consents
    cookiesConsent: 'input[type="checkbox"][name*="cookie"]',
    dataProcessingConsent: 'input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="rodo"]',
    
    // Submit button
    submitButton: 'button[type="submit"], input[type="submit"]',
  };
}

/**
 * Example usage with actual form filling (for use with browser automation)
 */
function fillSolidJobsForm(cvData, options = {}) {
  const formData = mapCVToSolidJobsForm(cvData, options);
  const selectors = getSolidJobsFormSelectors();
  
  // This would be used with a browser automation tool like Puppeteer or Playwright
  return {
    formData,
    selectors,
    instructions: [
      { selector: selectors.fullName, action: 'type', value: formData.fullName },
      { selector: selectors.email, action: 'type', value: formData.email },
      { selector: selectors.phone, action: 'type', value: formData.phone },
      { selector: selectors.employmentType, action: 'select', value: formData.employmentType },
      { selector: selectors.expectedSalary, action: 'type', value: formData.expectedSalary },
      { selector: selectors.availabilityDate, action: 'type', value: formData.availabilityDate },
      { selector: selectors.cvText, action: 'type', value: formData.cvText },
      { selector: selectors.coverLetter, action: 'type', value: formData.coverLetter },
      { selector: selectors.linkedInUrl, action: 'type', value: formData.linkedInUrl },
      { selector: selectors.portfolioUrl, action: 'type', value: formData.portfolioUrl },
      { selector: selectors.dataProcessingConsent, action: 'check', value: formData.agreeToDataProcessing },
    ].filter(instruction => instruction.value) // Only include fields with values
  };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mapCVToSolidJobsForm,
    formatCVText,
    getSolidJobsFormSelectors,
    fillSolidJobsForm,
  };
}

// Example usage:
/*
const cvData = require('../data/cv.json');

const applicationOptions = {
  employmentType: 'B2B',
  expectedSalary: '20000',
  salaryCurrency: 'PLN netto',
  availabilityDate: 'Natychmiast',
  noticePeriod: '1 miesiąc',
  remoteWork: true,
  coverLetter: 'I am very interested in this position...',
  acceptCookiesPolicy: true,
  agreeToDataProcessing: true,
};

const mappedData = mapCVToSolidJobsForm(cvData, applicationOptions);
console.log(mappedData);

// Or get ready-to-use fill instructions
const fillInstructions = fillSolidJobsForm(cvData, applicationOptions);
console.log(fillInstructions);
*/
