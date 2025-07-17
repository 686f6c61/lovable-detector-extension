/**
 * This script handles the logic for the extension's popup.
 * It manages the display of detected frameworks, theme switching,
 * and navigation between the main view and the project details.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Get references to key DOM elements
  const body = document.body; // The main body of the popup
  const resultDiv = document.getElementById('result'); // Div for displaying detection result
  const noResultDiv = document.getElementById('no-result'); // Div for displaying no detection message
  const aboutContentDiv = document.getElementById('about-content'); // Div for project details
  const aboutTextDiv = document.getElementById('about-text'); // Div to load about.html content into
  const viewProjectLink = document.getElementById('view-project-link'); // Link to view project details
  const backButton = document.getElementById('back-button'); // Button to go back from project details

  // Initial display based on framework detection
  // Checks if a framework was detected and updates the UI accordingly
  chrome.storage.local.get('detectedFramework', (data) => {
    if (data.detectedFramework) {
      // If detected, display the framework name and show the result section
      document.getElementById('framework-name').textContent = data.detectedFramework;
      resultDiv.style.display = 'block';
    } else {
      // If not detected, show the no-result section
      noResultDiv.style.display = 'block';
    }
  });

  // Event listener for the 'View Project' link
  viewProjectLink.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default link behavior (e.g., navigating away)
    
    // Hide the initial detection results
    resultDiv.style.display = 'none';
    noResultDiv.style.display = 'none';

    // Add 'hacker-mode' class to the body and back button for theme change
    body.classList.add('hacker-mode');
    backButton.classList.add('hacker-mode');

    // Fetch and load the content of about.html into the aboutTextDiv
    fetch(chrome.runtime.getURL('about.html'))
      .then(response => response.text()) // Get the response as text
      .then(data => {
        aboutTextDiv.innerHTML = data; // Insert the HTML content
        aboutContentDiv.style.display = 'block'; // Show the project details section
      })
      .catch(error => console.error('Error loading about.html:', error)); // Log any errors during fetch
  });

  // Event listener for the 'Back' button
  backButton.addEventListener('click', () => {
    // Hide the project details section
    aboutContentDiv.style.display = 'none';

    // Remove 'hacker-mode' class from the body and back button to revert theme
    body.classList.remove('hacker-mode');
    backButton.classList.remove('hacker-mode');

    // Show the appropriate initial content based on detection status
    chrome.storage.local.get('detectedFramework', (data) => {
      if (data.detectedFramework) {
        resultDiv.style.display = 'block';
      } else {
        noResultDiv.style.display = 'block';
      }
    });
  });
});