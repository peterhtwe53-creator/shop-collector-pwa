/* App logic */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9xNJfcnCrsjAGwyKu7odh8XMzPevyOvqpum20hHuyf3rb4fUncb10pFq711-LVqLd/exec"; // <-- paste your deployed Apps Script Web App URL

const form = document.getElementById("shopForm");
const stars = document.getElementById("stars");
const popularityInput = document.getElementById("popularity");
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");
const latInput = document.getElementById("latitude");
const lngInput = document.getElementById("longitude");
const accInput = document.getElementById("accuracy");
const locBadge = document.getElementById("locBadge");
const refreshLoc = document.getElementById("refreshLoc");
const installBtn = document.getElementById("installBtn");
const submitBtn = document.getElementById("submitBtn");
const toast = document.getElementById("toast");

let deferredPrompt = null;

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=> toast.classList.remove("show"), 2800);
}

function setStars(n){
  popularityInput.value = String(n);
  document.querySelectorAll(".star").forEach((el)=>{
    el.classList.toggle("active", Number(el.dataset.value) <= n);
  });
}

stars.addEventListener("click", (e)=>{
  const btn = e.target.closest(".star");
  if(!btn) return;
  setStars(Number(btn.dataset.value));
});

// Default selected stars to 3
setStars(Number(popularityInput.value || 3));

// Photo preview
photoInput.addEventListener("change", ()=>{
  photoPreview.innerHTML = "";
  const file = photoInput.files?.[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  const wrapper = document.createElement("div");
  wrapper.className = "thumb";
  const img = document.createElement("img");
  img.src = url;
  img.alt = "Selected photo preview";
  const badge = document.createElement("div");
  badge.className = "badge";
  badge.textContent = Math.round(file.size/1024) + " KB";
  wrapper.appendChild(img);
  wrapper.appendChild(badge);
  photoPreview.appendChild(wrapper);
});

// Geolocation
async function captureLocation(){
  if(!("geolocation" in navigator)){
    locBadge.textContent = "Location not supported";
    return;
  }
  locBadge.textContent = "Locating…";
  try {
    const pos = await new Promise((resolve, reject)=>{
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
    });
    const { latitude, longitude, accuracy } = pos.coords;
    latInput.value = latitude.toFixed(6);
    lngInput.value = longitude.toFixed(6);
    accInput.value = Math.round(accuracy);
    locBadge.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)} ±${Math.round(accuracy)}m`;
  } catch(err){
    console.error(err);
    locBadge.textContent = "Location blocked";
    showToast("Please allow location for better accuracy.");
  }
}

refreshLoc.addEventListener("click", captureLocation);

// Install prompt
window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener("click", async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
  showToast(outcome === "accepted" ? "App installed ✔" : "Install dismissed");
});

// Service worker
if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("./service-worker.js").catch(console.error);
  });
}

// Submit
form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!SCRIPT_URL || SCRIPT_URL === "YOUR_APPS_SCRIPT_WEB_APP_URL"){
    showToast("Add your Apps Script URL in app.js");
    return;
  }
  if(!photoInput.files?.length){
    showToast("Please attach a photo.");
    return;
  }
  submitBtn.classList.add("loading");
  submitBtn.disabled = true;
  try {
    const fd = new FormData(form);
    // Try normal CORS first
    let res, data;
    try{
      res = await fetch(SCRIPT_URL, { method: "POST", body: fd });
      if(res.ok){
        data = await res.json().catch(()=> ({}));
      } else {
        throw new Error("Non-OK response");
      }
    } catch(_){
      // Fallback for environments where GAS doesn't send CORS headers
      await fetch(SCRIPT_URL, { method: "POST", body: fd, mode: "no-cors" });
      data = { success: true, opaque: true };
    }

    if(data && data.success){
      showToast("Submitted ✔");
      form.reset();
      photoPreview.innerHTML = "";
      setStars(3);
      // Keep last known location
      if(latInput.value && lngInput.value){
        locBadge.textContent = `${latInput.value}, ${lngInput.value} ±${accInput.value || "?"}m`;
      }
    } else {
      showToast("Failed to submit");
      console.error("Server error:", data);
    }
  } catch(err){
    console.error(err);
    showToast("Error submitting");
  } finally {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
});

// Capture initial location as soon as page is interactive
document.addEventListener("DOMContentLoaded", captureLocation);
