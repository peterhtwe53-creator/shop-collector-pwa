// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // --- PASTE YOUR WEB APP URL FROM GOOGLE APPS SCRIPT HERE ---
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxfgT_liv3QC1ag-E8Ma3tURdriQwx0Yj43s2z1E9VZTySdPb-CXu6kl2wDETyZA9R7/exec";

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

  const getLocation = () => {
    // 1. Give immediate feedback to the user
    locBadge.textContent = 'Locating…';
    locBadge.classList.add('locating'); // Optional: for styling

    if (!navigator.geolocation) {
      locBadge.textContent = 'GPS not supported';
      locBadge.classList.remove('locating');
      return;
    }
    
    // 2. Define options for the GPS request
    const geoOptions = {
      enableHighAccuracy: true, // Request the most accurate location possible
      timeout: 15000,          // Stop trying after 15 seconds
      maximumAge: 0            // Don't use a cached location
    };

    // 3. Request the location asynchronously
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
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
    locBadge.textContent = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    locBadge.classList.remove('locating');
    console.log(`Location found: ${lat}, ${lon} (Accuracy: ${acc}m)`);
  };

  // 5. Handle errors (e.g., user denies permission, GPS unavailable)
  const geoError = (error) => {
    let errorMessage;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "GPS permission denied";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location unavailable";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out";
        break;
      default:
        errorMessage = "GPS error";
        break;
    }
    locBadge.textContent = errorMessage;
    locBadge.classList.remove('locating');
    console.error(`Geolocation Error: ${errorMessage} (Code: ${error.code})`);
  };
  
  // --- END OF GEOLOCATION LOGIC ---

  // Get location as soon as the app loads
  getLocation();

  // Add event listener for the "Refresh" button
  refreshLocBtn.addEventListener('click', getLocation);

  // Handle form submission (this part is mostly the same)
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

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      // The form data will now include the location from the hidden fields
      const formData = new FormData(form);
      const dataToPost = {
        fileData: reader.result,
        fileName: file.name,
        shopName: formData.get('shopName'),
        remark: formData.get('remark'),
        popularity: formData.get('popularity'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
      };
      
      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(dataToPost),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          showToast('Shop data saved successfully!');
          form.reset();
          photoPreview.innerHTML = '';
          getLocation(); // Get a new location for the next entry
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
      } finally {
        resetButton();
      }
    };
    reader.onerror = () => {
      showToast('Failed to read the file.', 'error');
      resetButton();
    };
  });

  // Helper functions (no changes needed here)
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
