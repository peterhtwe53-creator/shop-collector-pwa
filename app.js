/* Corrected PWA app logic */
document.addEventListener('DOMContentLoaded', () => {
    // --- PASTE YOUR WEB APP URL FROM GOOGLE APPS SCRIPT HERE ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyP-JUwQdcvmC06JktAZZbNu-llOTxxgJ8OGYs2j3ZLpXwUkl9R8LEgdcyFB9Ke0maI/exec";
    
    // Get all necessary DOM elements
    const form = document.getElementById("shopForm");
    const submitBtn = document.getElementById("submitBtn");
    const toast = document.getElementById("toast");
    const locBadge = document.getElementById("locBadge");
    const refreshLocBtn = document.getElementById("refreshLoc");
    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");
    const accuracyInput = document.getElementById("accuracy");
    const popularityInput = document.getElementById("popularity");
    const starsContainer = document.getElementById("stars");

    // --- Geolocation Logic ---

    // Function to get the current location and populate the form fields
    const getAndDisplayLocation = () => {
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

        const geoSuccess = (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const acc = position.coords.accuracy;

            latitudeInput.value = lat.toFixed(6);
            longitudeInput.value = lon.toFixed(6);
            accuracyInput.value = Math.round(acc);
            locBadge.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)} (±${Math.round(acc)}m)`;
            locBadge.classList.remove('locating');
            showToast('Location captured!', 'success');
        };

        const geoError = (error) => {
            const errorMessage = `Geolocation Error: ${error.message || 'Unknown error'}`;
            locBadge.textContent = 'Location blocked or unavailable';
            locBadge.classList.remove('locating');
            showToast(errorMessage, 'error');
            console.error(errorMessage, error);
        };

        // Use getCurrentPosition for a one-time location request
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
        console.log("Getting current location...");
    };

    // --- Star Rating Logic ---
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

    // --- Form Submission Logic ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Basic form validation
        if (!latitudeInput.value || !longitudeInput.value) {
            showToast("Waiting for GPS location. Please try again in a moment.", 'error');
            return;
        }

        // Show loading state
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const res = await fetch(SCRIPT_URL, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server responded with status ${res.status}: ${errorText}`);
            }

            const result = await res.json();
            if (result.status === 'SUCCESS') {
                showToast("Data submitted successfully!", 'success');
                form.reset();
                setStars(3); // Reset stars to a default value
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

    // --- Utility Functions ---
    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Call the function on page load and when the refresh button is clicked
    getAndDisplayLocation();
    refreshLocBtn.addEventListener("click", getAndDisplayLocation);
});
