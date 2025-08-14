// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // --- PASTE YOUR WEB APP URL FROM GOOGLE APPS SCRIPT HERE ---
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxfgT_liv3QC1ag-E8Ma3tURdriQwx0Yj43s2z1E9VZTySdPb-CXu6kl2wDETyZA9R7/exec"; // **REMEMBER TO UPDATE THIS**

  // Get all necessary DOM elements
  const form = document.getElementById('shopForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  const photoInput = document.getElementById('photo');
  const photoPreview = document.getElementById('photoPreview');
  const toast = document.getElementById('toast');
  const locBadge = document.getElementById('locBadge');
  const refreshLocBtn = document.getElementById('refreshLoc');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');
  const accuracyInput = document.getElementById('accuracy');

  // --- 📍 NEW & IMPROVED GEOLOCATION HANDLING ---

  let watchId; // To store the ID of the watchPosition call

  const startWatchingLocation = () => {
    // 1. Give immediate feedback to the user
    locBadge.textContent = 'Locating…';
    locBadge.classList.add('locating'); // Optional: for styling

    if (!navigator.geolocation) {
      locBadge.textContent = 'GPS not supported';
      locBadge.classList.remove('locating');
      showToast('Your browser does not support Geolocation.', 'error');
      return;
    }

    // 2. Define options for the GPS request
    const geoOptions = {
      enableHighAccuracy: true, // Request the most accurate location possible
      timeout: 20000,          // Stop trying after 20 seconds (increased for better first fix)
      maximumAge: 0            // Don't use a cached location
    };

    // Clear any existing watch to prevent multiple listeners
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }

    // 3. Request the location asynchronously and continuously
    // watchPosition will call geoSuccess repeatedly as location changes
    watchId = navigator.geolocation.watchPosition(geoSuccess, geoError, geoOptions);
    console.log("Started watching location...");
  };

  // 4. Handle a successful location fetch
  const geoSuccess = (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const acc = position.coords.accuracy;

    // Update the hidden form inputs with the coordinates
    latitudeInput.value = lat;
    longitudeInput.value = lon;
    accuracyInput.value = acc;

    // Update the UI to show the user it worked
    locBadge.textContent = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)} (±${acc.toFixed(0)}m)`;
    locBadge.classList.remove('locating');
    console.log(`Location updated: ${lat}, ${lon} (Accuracy: ${acc}m)`);

    // Show a small toast only when a new, more accurate location is found
    // Or if it's the first successful fix.
    if (!locBadge.dataset.hasInitialFix || parseFloat(accuracyInput.dataset.lastAccuracy || Infinity) > acc) {
      showToast('Location updated!', 'success');
      locBadge.dataset.hasInitialFix = 'true';
      accuracyInput.dataset.lastAccuracy = acc;
    }
  };

  // 5. Handle errors (e.g., user denies permission, GPS unavailable)
  const geoError = (error) => {
    let errorMessage;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "GPS permission denied. Please enable it in browser settings.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information is unavailable.";
        break;
      case error.TIMEOUT:
        errorMessage = "The request to get user location timed out.";
        break;
      default:
        errorMessage = `An unknown GPS error occurred (Code: ${error.code}).`;
        break;
    }
    locBadge.textContent = errorMessage;
    locBadge.classList.remove('locating');
    showToast(`Geolocation Error: ${errorMessage}`, 'error');
    console.error(`Geolocation Error: ${errorMessage} (Code: ${error.code})`);
  };

  // --- END OF GEOLOCATION LOGIC ---

  // Start watching location as soon as the app loads
  startWatchingLocation();

  // Add event listener for the "Refresh" button to re-initiate watch
  refreshLocBtn.addEventListener('click', startWatchingLocation);

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnText.textContent = 'Submitting...';
    btnSpinner.style.display = 'inline-block';
    submitBtn.disabled = true;

    const file = photoInput.files[0];
    if (!file) {
      showToast('Please select a photo.', 'error');
      resetButton();
      return;
    }

    // Check if location data is available
    if (!latitudeInput.value || !longitudeInput.value) {
      showToast('Waiting for GPS location. Please try again in a moment.', 'error');
      resetButton();
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      // The form data will now include the location from the hidden fields
      const formData = new FormData(form);
      const dataToPost = {
        // **IMPORTANT**: Send only the base64 part, not the "data:image/..." prefix
        // The Apps Script will typically expect just the base64 string.
        fileData: reader.result.split(',')[1],
        fileName: file.name,
        shopName: formData.get('shopName'),
        remark: formData.get('remark'),
        popularity: formData.get('popularity'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        accuracy: formData.get('accuracy'), // Ensure accuracy is also sent
      };

      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(dataToPost),
          // Set Content-Type to application/json, as we're sending a JSON string
          headers: { 'Content-Type': 'application/json' },
        });

        // Check if the response is OK (status 200-299)
        if (!response.ok) {
          const errorText = await response.text(); // Get raw error response
          throw new Error(`Server responded with status ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        if (result.status === 'SUCCESS') {
          showToast('Shop data saved successfully!');
          form.reset();
          photoPreview.innerHTML = '';
          // No need to call getLocation() again here, as watchPosition is continuous
        } else {
          // If the server returns a specific error message in the JSON
          throw new Error(result.message || 'An unknown error occurred on the server.');
        }
      } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
        console.error("Submission Error:", error);
      } finally {
        resetButton();
      }
    };
    reader.onerror = () => {
      showToast('Failed to read the file.', 'error');
      resetButton();
    };
  });

  // Helper functions (no changes needed here, but ensure they are present)
  function resetButton() {
    btnText.textContent = 'Submit';
    btnSpinner.style.display = 'none';
    submitBtn.disabled = false;
  }

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => photoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo preview">`;
      reader.readAsDataURL(file);
    } else {
      photoPreview.innerHTML = '';
    }
  });

  document.getElementById('stars').addEventListener('click', (e) => {
    if (e.target.classList.contains('star')) {
      document.getElementById('popularity').value = e.target.dataset.value;
    }
  });
});
