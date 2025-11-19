// popup.js - CV AutoFill Extension

let cvData = null;

document.addEventListener("DOMContentLoaded", function () {
  const cvFileInput = document.getElementById("cvFile");
  const fillButton = document.getElementById("fillButton");
  const detectButton = document.getElementById("detectButton");
  const toggleOptionsButton = document.getElementById("toggleOptions");
  const advancedOptions = document.getElementById("advancedOptions");
  const statusDiv = document.getElementById("status");
  const cvInfo = document.getElementById("cvInfo");
  const cvName = document.getElementById("cvName");
  
  // Load saved CV and settings from storage
  chrome.storage.local.get(["cvData", "employmentType", "expectedSalary", "availabilityDate", "coverLetter"], function (result) {
    if (result.cvData) {
      cvData = result.cvData;
      showCVLoaded(cvData.basics?.name || "CV");
      fillButton.disabled = false;
    }
    
    // Restore saved form values
    if (result.employmentType) {
      document.getElementById("employmentType").value = result.employmentType;
    }
    if (result.expectedSalary) {
      document.getElementById("expectedSalary").value = result.expectedSalary;
    }
    if (result.availabilityDate) {
      document.getElementById("availabilityDate").value = result.availabilityDate;
    }
    if (result.coverLetter) {
      document.getElementById("coverLetter").value = result.coverLetter;
    }
  });
  
  // Toggle advanced options
  toggleOptionsButton.addEventListener("click", function () {
    advancedOptions.classList.toggle("show");
  });
  
  // Auto-save options when they change
  const saveOptions = () => {
    chrome.storage.local.set({
      employmentType: document.getElementById("employmentType").value,
      expectedSalary: document.getElementById("expectedSalary").value,
      availabilityDate: document.getElementById("availabilityDate").value,
      coverLetter: document.getElementById("coverLetter").value,
    });
  };
  
  document.getElementById("employmentType").addEventListener("change", saveOptions);
  document.getElementById("expectedSalary").addEventListener("input", saveOptions);
  document.getElementById("availabilityDate").addEventListener("input", saveOptions);
  document.getElementById("coverLetter").addEventListener("input", saveOptions);
  
  // Handle CV file upload
  cvFileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        cvData = JSON.parse(e.target.result);
        
        // Save to storage
        chrome.storage.local.set({ cvData: cvData }, function () {
          showStatus("CV załadowane pomyślnie!", "success");
          showCVLoaded(cvData.basics?.name || file.name);
          fillButton.disabled = false;
        });
      } catch (error) {
        showStatus("Błąd: Nieprawidłowy format JSON", "error");
        console.error("JSON parse error:", error);
      }
    };
    reader.readAsText(file);
  });
  
  // Handle fill button click
  fillButton.addEventListener("click", function () {
    if (!cvData) {
      showStatus("Błąd: Najpierw wczytaj CV", "error");
      return;
    }
    
    // Get options from form
    const options = {
      employmentType: document.getElementById("employmentType").value,
      expectedSalary: document.getElementById("expectedSalary").value,
      availabilityDate: document.getElementById("availabilityDate").value,
      coverLetter: document.getElementById("coverLetter").value,
      salaryCurrency: "PLN netto",
      agreeToDataProcessing: true,
    };
    
    // Save options to storage for next time
    chrome.storage.local.set({
      employmentType: options.employmentType,
      expectedSalary: options.expectedSalary,
      availabilityDate: options.availabilityDate,
      coverLetter: options.coverLetter,
    });
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      
      // First, try to inject the content scripts if they're not already loaded
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['mappers/solidJobsMapper.js', 'mappers/traffitMapper.js', 'mappers/eRecruiterMapper.js', 'content.js']
      }).then(() => {
        // Now send the message
        sendFillMessage(activeTab.id, cvData, options);
      }).catch((error) => {
        // Scripts might already be loaded, try sending message anyway
        console.log('Script injection error (might already be loaded):', error);
        sendFillMessage(activeTab.id, cvData, options);
      });
    });
  });
  
  function sendFillMessage(tabId, cvData, options) {
    chrome.tabs.sendMessage(
      tabId,
      {
        action: "fillForm",
        cvData: cvData,
        options: options,
      },
      function (response) {
        if (chrome.runtime.lastError) {
          showStatus("Błąd: " + chrome.runtime.lastError.message + ". Odśwież stronę i spróbuj ponownie.", "error");
          return;
        }
        
        if (response && response.success) {
          showStatus(response.message, "success");
        } else {
          showStatus(
            response?.message || "Nie znaleziono formularza do wypełnienia",
            "error"
          );
        }
      }
    );
  }
  
  // Handle detect button click
  detectButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      
      // Inject scripts first
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['mappers/solidJobsMapper.js', 'mappers/traffitMapper.js', 'mappers/eRecruiterMapper.js', 'content.js']
      }).then(() => {
        sendDetectMessage(activeTab.id);
      }).catch((error) => {
        console.log('Script injection error (might already be loaded):', error);
        sendDetectMessage(activeTab.id);
      });
    });
  });
  
  function sendDetectMessage(tabId) {
    chrome.tabs.sendMessage(
      tabId,
      { action: "detectForm" },
      function (response) {
        if (chrome.runtime.lastError) {
          showStatus("Błąd: " + chrome.runtime.lastError.message + ". Odśwież stronę i spróbuj ponownie.", "error");
          return;
        }
        
        if (response && response.detected) {
          showStatus(
            `Wykryto formularz: ${response.formType} na ${response.url}`,
            "success"
          );
        } else {
          showStatus(
            "Nie wykryto wspieranego formularza na tej stronie",
            "info"
          );
        }
      }
    );
  }
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    
    // Auto-hide after 5 seconds for success messages
    if (type === "success") {
      setTimeout(() => {
        statusDiv.style.display = "none";
      }, 5000);
    }
  }
  
  function showCVLoaded(name) {
    cvName.textContent = name;
    cvInfo.style.display = "block";
  }
});

// Listen for form detection from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "formDetected") {
    console.log("Form detected:", request.formType, request.url);
  }
});