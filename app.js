// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // --- PASTE YOUR WEB APP URL FROM GOOGLE APPS SCRIPT HERE ---
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxfgT_liv3QC1ag-E8Ma3tURdriQwx0Yj43s2z1E9VZTySdPb-CXu6kl2wDETyZA9R7/exec";

  // Get form elements
  const form = document.getElementById('shopForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  const photoInput = document.getElementById('photo');
  const photoPreview = document.getElementById('photoPreview');
  const toast = document.getElementById('toast');

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default browser submission

    // Show loading state
    btnText.textContent = 'Submitting...';
    btnSpinner.style.display = 'inline-block';
    submitBtn.disabled = true;

    const file = photoInput.files[0];
    if (!file) {
      showToast('Please select a photo.', 'error');
      resetButton();
      return;
    }

    // Convert image to Base64 to send as text
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const fileData = reader.result;
      const formData = new FormData(form);

      // We send file data as a structured object to Apps Script
      const dataToPost = {
        fileData: fileData,
        fileName: file.name,
        shopName: formData.get('shopName'),
        remark: formData.get('remark'),
        popularity: formData.get('popularity'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
      };

      try {
        // Send data to Google Apps Script
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(dataToPost), // Apps Script doPost expects a string payload
          headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Required for this method
          },
        });

        const result = await response.json();

        if (result.status === 'SUCCESS') {
          showToast('Shop data saved successfully!');
          form.reset();
          photoPreview.innerHTML = ''; // Clear preview
        } else {
          throw new Error(result.message || 'An unknown error occurred.');
        }

      } catch (error) {
        console.error('Submission Error:', error);
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

  // Function to reset the submit button to its original state
  function resetButton() {
    btnText.textContent = 'Submit';
    btnSpinner.style.display = 'none';
    submitBtn.disabled = false;
  }

  // Function to show a success/error message
  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // --- Optional: Add other JS logic from your original app here ---
  // For photo preview
  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        photoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo preview">`;
      };
      reader.readAsDataURL(file);
    } else {
      photoPreview.innerHTML = '';
    }
  });

  // Example functions for stars and location to make it runnable
  // You would replace this with your actual implementation
  const stars = document.getElementById('stars');
  stars.addEventListener('click', (e) => {
    if (e.target.classList.contains('star')) {
        document.getElementById('popularity').value = e.target.dataset.value;
        console.log(`Rating set to: ${e.target.dataset.value}`);
        // Add styling for selected stars if you wish
    }
  });

});
