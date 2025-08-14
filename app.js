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

  // --- 📍 NEW "QUICK & SMOOTH" GPS LOGIC ---

  let locationWatcherId = null;
  let currentBestAccuracy = Infinity;

  // This function uses `watchPosition` to get continuous, refined updates.
  const startLocationWatcher = () => {
    // 1. Reset state for a fresh watch
    locBadge.textContent = 'Locating…';
    locBadge.classList.add('locating');
    currentBestAccuracy = Infinity; // Reset accuracy tracking

    if (!navigator.geolocation) {
      locBadge.textContent = 'GPS not supported';
      locBadge.classList.remove('locating');
      return;
    }

    // 2. Stop any previous watcher to prevent multiple listeners
    if (locationWatcherId) {
      navigator.geolocation.clearWatch(locationWatcherId);
    }
    
    // 3. Define options for the GPS request
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 20000,      // Stop trying after 20 seconds
      maximumAge: 0        // We always want a fresh location
    };

    // 4. Start watching the position. `geoSuccess` will be called repeatedly.
    locationWatcherId = navigator.geolocation.watchPosition(geoSuccess, geoError, geoOptions);
    console.log("Started GPS position watcher.");
  };

  // 5. Handle a successful location update
  const geoSuccess = (position) => {
    const newAccuracy = position.coords.accuracy;
    
    // We only accept the new location if it's more accurate than the last one.
    if (newAccuracy < currentBestAccuracy) {
      currentBestAccuracy = newAccuracy;
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Update the hidden form inputs with the best coordinates so far
      latitudeInput.value = lat;
      longitudeInput.value = lon;
      accuracyInput.value = newAccuracy;

      // Update the UI to show the user the improving accuracy
      locBadge.textContent = `Accuracy: ${newAccuracy.toFixed(0)}m`;
      locBadge.classList.remove('locating');
      console.log(`New best location: Lat: ${lat}, Lon: ${lon}, Acc: ${newAccuracy}m`);
    }
  };

  // 6. Handle errors during the watch process
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
    
    // Stop the watcher on critical errors
    if (locationWatcherId) {
        navigator.geolocation.clearWatch(locationWatcherId);
    }
  };
  
  // --- END OF GEOLOCATION LOGIC ---

  // Start watching for location as soon as the app loads
  startLocationWatcher();

  // The "Refresh" button now restarts the watcher for a fresh fix
  refreshLocBtn.addEventListener('click', startLocationWatcher);

  // --- DATA SUBMISSION LOGIC (UNCHANGED) ---
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
      const formData = new FormData(form);
      const dataToPost = {
        fileData: reader.result,
        fileName: file.name,
        shopName: formData.get('shopName'),
        remark: formData.get('remark'),
        popularity: formData.get('popularity'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        accuracy: formData.get('accuracy') // Now includes accuracy
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
          startLocationWatcher(); // Restart watcher for the next entry
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
