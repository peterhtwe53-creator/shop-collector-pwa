/* Corrected PWA app logic */
document.addEventListener('DOMContentLoaded', () => {
    // --- PASTE YOUR WEB APP URL FROM GOOGLE APPS SCRIPT HERE ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyP-JUwQdcvmC06JktAZZbNu-llOTxxgJ8OGYs2j3ZLpXwUkl9R8LEgdcyFB9Ke0maI/exec";
    
    // Get all necessary DOM elements
    const form = document.getElementById("shopForm");
    const submitBtn = document.getElementById("submitBtn");
    const photoInput = document.getElementById("photo");
    const photoPreview = document.getElementById("photoPreview");
    const toast = document.getElementById("toast");
    const locBadge = document.getElementById("locBadge");
    const refreshLocBtn = document.getElementById("refreshLoc");
    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");
    const accuracyInput = document.getElementById("accuracy");
    const popularityInput = document.getElementById("popularity");
    const starsContainer = document.getElementById("stars");

    // --- Geolocation Logic (no changes needed) ---
    let watchId; 

    const startWatchingLocation = () => {
        locBadge.textContent = 'Locating…';
        locBadge.classList.add('locating');

        if (!navigator.geolocation) {
            locBadge.textContent = 'GPS not supported';
            locBadge.classList.remove('locating');
            showToast('Your browser does not support Geolocation.', 'error');
            return;
        }

        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        };

        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
        }

        watchId = navigator.geolocation.watchPosition(geoSuccess, geoError, geoOptions);
        console.log("Started watching location...");
    };

    const geoSuccess = (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const acc = position.coords.accuracy;

        if (!locBadge.dataset.hasInitialFix) {
            latitudeInput.value = lat.toFixed(6);
            longitudeInput.value = lon.toFixed(6);
            accuracyInput.value = Math.round(acc);
            locBadge.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)} (±${Math.round(acc)}m)`;
            locBadge.classList.remove('locating');
            showToast('Location captured!', 'success');
            locBadge.dataset.hasInitialFix = 'true';
            
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
        }
    };

    const geoError = (error) => {
        const errorMessage = `Geolocation Error: ${error.message || 'Unknown error'}`;
        locBadge.textContent = 'Location blocked or unavailable';
        locBadge.classList.remove('locating');
        showToast(errorMessage, 'error');
        console.error(errorMessage, error);
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
        }
    };

    // --- Photo Preview & Star Rating Logic (with new canvas approach) ---
    const setStars = (n) => {
        popularityInput.value = String(n);
        document.querySelectorAll(".star").forEach((el) => {
            el.classList.toggle("active", Number(el.dataset.value) <= n);
        });
    };
    
    setStars(Number(popularityInput.value || 3));
    starsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".star");
        if (!btn) return;
        setStars(Number(btn.dataset.value));
    });

    let photoDataUrl = null; // Store the Base64 data here

    photoInput.addEventListener("change", (e) => {
        photoPreview.innerHTML = "";
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);
                
                // Store the Base64 data in a variable
                photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                
                // Display the image preview
                const wrapper = document.createElement("div");
                wrapper.className = "thumb";
                const previewImg = document.createElement("img");
                previewImg.src = photoDataUrl;
                previewImg.alt = "Selected photo preview";
                wrapper.appendChild(previewImg);
                photoPreview.appendChild(wrapper);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    // --- FIX STARTS HERE: Form Submission with Base64 from Canvas ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Basic form validation
        if (!photoDataUrl) {
            showToast("Please attach a photo.", 'error');
            return;
        }
        if (!latitudeInput.value || !longitudeInput.value) {
            showToast("Waiting for GPS location. Please try again in a moment.", 'error');
            return;
        }

        // Show loading state
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;

        const dataToPost = {
            shopName: document.getElementById('shopName').value,
            remark: document.getElementById('remark').value,
            popularity: popularityInput.value,
            latitude: latitudeInput.value,
            longitude: longitudeInput.value,
            accuracy: accuracyInput.value,
            fileData: photoDataUrl.split(',')[1],
            fileName: 'photo.jpg' // A generic name is fine for this method
        };

        try {
            const res = await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(dataToPost),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server responded with status ${res.status}: ${errorText}`);
            }

            const result = await res.json();
            if (result.status === 'SUCCESS') {
                showToast("Data submitted successfully!", 'success');
                form.reset();
                photoPreview.innerHTML = "";
                setStars(3);
                photoDataUrl = null; // Clear the stored data
            } else {
                throw new Error(result.message || "An unknown error occurred on the server.");
            }
        } catch (err) {
            console.error("Submission Error:", err);
            showToast(`Error: ${err.message}`, 'error');
        } finally {
            submitBtn.classList.remove("loading");
            submitBtn.disabled = false;
        }
    });
    // --- FIX ENDS HERE ---

    // --- Utility Functions (no changes needed) ---
    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    startWatchingLocation();
    refreshLocBtn.addEventListener("click", () => {
        delete locBadge.dataset.hasInitialFix;
        startWatchingLocation();
    });
});
