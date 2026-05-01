let currentPropertyData = null;

const output = document.getElementById("output");
const status = document.getElementById("status");
const extractBtn = document.getElementById("extractBtn");
const saveBtn = document.getElementById("saveBtn");
const copyBtn = document.getElementById("copyBtn");

const openSavedBtn = document.getElementById("openSavedBtn");

function setStatus(message, isError = false) {
  status.textContent = message;
  status.className = isError ? "status error" : "status";
}

function renderData(data) {
  output.textContent = JSON.stringify(data, null, 2);
}

extractBtn.addEventListener("click", async () => {
  setStatus("");
  output.textContent = "Extracting...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      setStatus("Could not find active tab.", true);
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "EXTRACT_PROPERTY"
    });

    if (!response || !response.success) {
      output.textContent = "No property data found.";
      setStatus(response?.error || "Could not extract listing details.", true);
      return;
    }

    currentPropertyData = response.data;
    renderData(currentPropertyData);
    setStatus("Property extracted.");
  } catch (error) {
    output.textContent = "No property data found.";
    setStatus(`Error: ${error.message}`, true);
  }
});

saveBtn.addEventListener("click", async () => {
  if (!currentPropertyData) {
    setStatus("Extract property first please", true);
    return;
  }

  try {
    const result = await chrome.storage.local.get(["savedProperties"]);
    const savedProperties = result.savedProperties || [];

    const alreadyExists = savedProperties.some(
      (item) => item.listing_url === currentPropertyData.listing_url
    );

    if (alreadyExists) {
      setStatus("This property is already saved.");
      return;
    }

    savedProperties.push(currentPropertyData);
    await chrome.storage.local.set({ savedProperties });

    setStatus("Property saved to extension storage.");
  } catch (error) {
    setStatus(`Save failed: ${error.message}`, true);
  }
});

copyBtn.addEventListener("click", async () => {
  if (!currentPropertyData) {
    setStatus("Extract property first.", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(currentPropertyData, null, 2));
    setStatus("Copied JSON to clipboard.");
  } catch (error) {
    setStatus(`Copy failed: ${error.message}`, true);
  }

  
});

if (openSavedBtn) {
  openSavedBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("saved.html") });
  });
}