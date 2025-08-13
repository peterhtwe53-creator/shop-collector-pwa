// CHANGE THIS TO YOUR DEPLOYED WEB APP URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9xNJfcnCrsjAGwyKu7odh8XMzPevyOvqpum20hHuyf3rb4fUncb10pFq711-LVqLd/exec";

let currentLat = "";
let currentLng = "";
let currentAcc = "";

// Get GPS location on load
window.onload = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        currentLat = pos.coords.latitude;
        currentLng = pos.coords.longitude;
        currentAcc = pos.coords.accuracy;
        console.log("Location:", currentLat, currentLng, currentAcc);
      },
      err => {
        console.warn("Location access denied or unavailable.");
      }
    );
  }
};

// Submit form
document.getElementById("submitBtn").addEventListener("click", async () => {
  const shopName = document.getElementById("shopName").value.trim();
  if (!shopName) {
    M.toast({html: "Please enter shop name"});
    return;
  }

  const remark = document.getElementById("remark").value.trim();
  const popularity = document.querySelector('input[name="popularity"]:checked')?.value || "";
  const photoFile = document.getElementById("photo").files[0];

  const formData = new FormData();
  formData.append("shopName", shopName);
  formData.append("remark", remark);
  formData.append("popularity", popularity);
  formData.append("latitude", currentLat);
  formData.append("longitude", currentLng);
  formData.append("accuracy", currentAcc);

  if (photoFile) {
    formData.append("photo", photoFile, photoFile.name);
  }

  document.getElementById("status").textContent = "Submitting...";

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: formData
    });

    const text = await res.text();
    console.log(text);
    M.toast({html: "Data saved successfully!"});
    document.getElementById("status").textContent = "Submitted ✔";
  } catch (err) {
    console.error(err);
    M.toast({html: "Error saving data"});
    document.getElementById("status").textContent = "Error ❌";
  }
});
