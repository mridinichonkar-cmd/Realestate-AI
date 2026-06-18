const tableContainer = document.getElementById("tableContainer");
const refreshBtn = document.getElementById("refreshBtn");
const clearBtn = document.getElementById("clearBtn");

const cashRateInput = document.getElementById("cashRateInput");
const medianIncomeInput = document.getElementById("medianIncomeInput");
const kmFromCbdInput = document.getElementById("kmFromCbdInput");



async function getSavedProperties() {
  const result = await chrome.storage.local.get(["savedProperties"]);
  return result.savedProperties || [];
}

async function saveAllProperties(properties) {
  await chrome.storage.local.set({ savedProperties: properties });
}

// ------------------- helper functions ---------------------
function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return value;
}

function formatBoolean(value) {
  return value ? "Yes" : "No";
}

function formatCurrency(value) {
  if (value === null || value === undefined) {
    return "-";
  }
  return `$${Number(value).toLocaleString()}`;
}

function getVerdictClass(verdict) {
  const value = String(verdict || "").toLowerCase();

  if (value.includes("under")) return "undervalued";
  if (value.includes("over")) return "overpriced";
  if (value.includes("fair")) return "fair";

  return "unknown";
}

function getCurrentAssumptions() {
  return {
    cash_rate: Number(cashRateInput.value) || 4.1,
    suburb_median_income: Number(medianIncomeInput.value) || 45000,
    km_from_cbd: Number(kmFromCbdInput.value) || 37
  };
}

//-------------------- table generation ------------------

function createTable(properties) {
  if (!properties.length) {
    tableContainer.innerHTML = `<div class="empty">No saved listings yet.</div>`;
    return;
  }

  const totalListings = properties.length;

  const undervaluedCount = properties.filter(p =>
    (p.difference || 0) > 0
  ).length;

  const opportunities = properties
    .map(p => Number(p.difference) || 0)
    .filter(diff => diff > 0);

  const averageDiscount =
    opportunities.length > 0
      ? opportunities.reduce((a, b) => a + b, 0) / opportunities.length
      : 0;

  const bestOpportunity =
    opportunities.length > 0
      ? Math.max(...opportunities)
      : 0;

  let html = `
    <section class="metrics-grid">
      <div class="metric-card">
        <span>Total Listings</span>
        <strong>${totalListings}</strong>
      </div>

      <div class="metric-card positive">
        <span>Undervalued</span>
        <strong>${undervaluedCount}</strong>
      </div>

      <div class="metric-card">
        <span>Average Discount</span>
        <strong>${formatCurrency(Math.round(averageDiscount))}</strong>
      </div>

      <div class="metric-card positive">
        <span>Best Opportunity</span>
        <strong>${formatCurrency(bestOpportunity)}</strong>
      </div>

    </section>

    <section class="listing-grid">
  `;

  properties.forEach((property, index) => {
    html += `
      <article class="listing-card">
        <div class="listing-header">
          <div>
            <h2>${formatValue(property.address)}</h2>
            
          </div>

          <span class="verdict-pill ${getVerdictClass(property.verdict)}">
            ${formatValue(property.verdict)}
          </span>
        </div>

        <div class="property-meta">
          <span>${formatValue(property.type)}</span>
          <span>${formatValue(property.num_bed ?? property.bedrooms)} bed</span>
          <span>${formatValue(property.num_bath ?? property.bathrooms)} bath</span>
          <span>${formatValue(property.num_parking ?? property.parking_spaces)} parking</span>
          <span>${formatValue(property.property_size)} sqm</span>
        </div>

        <div class="analysis-grid">
          <div>
            <span>Listed Price</span>
            <input class="edit-input" data-index="${index}" data-field="listed_price"
              value="${property.listed_price ?? property.rent_weekly ?? ""}">
          </div>

          <div>
            <span>Predicted Price</span>
            <strong>${formatCurrency(property.predicted_price)}</strong>
          </div>

          <div>
            <span>Difference</span>
            <strong>${formatCurrency(property.difference)}</strong>
          </div>

          <div>
            <span>Property Type</span>
            <select class="edit-input" data-index="${index}" data-field="type">
              <option value="">Select</option>
              <option value="House" ${property.type === "House" ? "selected" : ""}>House</option>
              <option value="Apartment" ${property.type === "Apartment" ? "selected" : ""}>Apartment</option>
              <option value="Townhouse" ${property.type === "Townhouse" ? "selected" : ""}>Townhouse</option>
              <option value="Unit" ${property.type === "Unit" ? "selected" : ""}>Unit</option>
              <option value="Other" ${property.type === "Other" ? "selected" : ""}>Other</option>
            </select>
          </div>
        </div>

        <div class="quick-edit-grid">
          <input class="edit-input" data-index="${index}" data-field="num_bed"
            placeholder="Beds" value="${property.num_bed ?? property.bedrooms ?? ""}">

          <input class="edit-input" data-index="${index}" data-field="num_bath"
            placeholder="Baths" value="${property.num_bath ?? property.bathrooms ?? ""}">

          <input class="edit-input" data-index="${index}" data-field="num_parking"
            placeholder="Parking" value="${property.num_parking ?? property.parking_spaces ?? ""}">

          <input class="edit-input" data-index="${index}" data-field="property_size"
            placeholder="Size" value="${property.property_size ?? ""}">
        </div>

        <textarea class="notes-box" data-index="${index}" placeholder="Add notes about this listing...">${property.notes || ""}</textarea>

        <div class="card-actions">
          <button class="predict-btn" data-index="${index}">Predict</button>
          <button class="save-notes-btn" data-index="${index}">Save Notes</button>
          <button class="open-link" data-url="${property.listing_url}">Open Link</button>
          <button class="delete-btn" data-index="${index}">Delete</button>
        </div>
      </article>
    `;
  });

  html += `</section>`;

  tableContainer.innerHTML = html;
  attachEventHandlers(properties);
}

function attachEventHandlers(properties) {
  const deleteButtons = document.querySelectorAll(".delete-btn");
  const saveNotesButtons = document.querySelectorAll(".save-notes-btn");
  const statusSelects = document.querySelectorAll(".status-select");
  const predictButtons = document.querySelectorAll(".predict-btn");

  predictButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
    const index = Number(event.target.dataset.index);
    const property = properties[index];
    
    const assumptions = getCurrentAssumptions();
    await chrome.storage.local.set({ modelAssumptions: assumptions });
    
    try{
      const payload = {
        suburb: property.suburb,
        type: property.type,
        num_bath: property.num_bath,
        num_bed: property.num_bed,
        num_parking: property.num_parking,
        property_size: property.property_size,
        listed_price: property.listed_price,

        // frontend assumption tailored to user
        ...assumptions
    };

    const response = await fetch("http://127.0.0.1:5000/predict",{
      method:"POST",
      headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)

    });

     const result = await response.json();

      if (result.error) {
        alert(`Prediction failed: ${result.error}`);
        return;
      }
      
      properties[index].predicted_price = result.predicted_price;
      properties[index].difference = result.difference;
      properties[index].verdict = result.label;

      await saveAllProperties(properties);
      createTable(properties);

    } catch (error) {
        alert(`Request failed: ${error.message}`);
      }
   });
});

const editInputs = document.querySelectorAll(".edit-input");

editInputs.forEach((input) => {
  input.addEventListener("change", async (event) => {
    const index = Number(event.target.dataset.index);
    const field = event.target.dataset.field;
    let value = event.target.value;

    const numberFields = [
      "listed_price",
      "num_bed",
      "num_bath",
      "num_parking",
      "property_size"
    ];

    if (numberFields.includes(field)) {
      value = value === "" ? null : Number(value);
    }

    properties[index][field] = value;

    await saveAllProperties(properties);
  });
});

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const index = Number(event.target.dataset.index);
      properties.splice(index, 1);
      await saveAllProperties(properties);
      createTable(properties);
    });
  });

  saveNotesButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const index = Number(event.target.dataset.index);
      const textarea = document.querySelector(`.notes-box[data-index="${index}"]`);
      properties[index].notes = textarea.value;
      await saveAllProperties(properties);
      alert("Notes saved.");
    });
  });

  document.querySelectorAll(".open-link").forEach((button) => {
  button.addEventListener("click", () => {
    window.open(button.dataset.url, "_blank");
  });
});

  statusSelects.forEach((select) => {
    select.addEventListener("change", async (event) => {
      const index = Number(event.target.dataset.index);
      properties[index].status = event.target.value;
      await saveAllProperties(properties);
    });
  });
}



async function loadTable() {
  const result = await chrome.storage.local.get(["modelAssumptions"]);

  if (result.modelAssumptions) {
    cashRateInput.value =
      result.modelAssumptions.cash_rate ?? 4.1;

    medianIncomeInput.value =
      result.modelAssumptions.suburb_median_income ?? 45000;

    kmFromCbdInput.value =
      result.modelAssumptions.km_from_cbd ?? 37;
  }

  const properties = await getSavedProperties();
  createTable(properties);
}

refreshBtn.addEventListener("click", loadTable);

clearBtn.addEventListener("click", async () => {
  const confirmed = confirm("Are you sure you want to delete all saved listings?");
  if (!confirmed) return;

  await chrome.storage.local.set({ savedProperties: [] });
  loadTable();
});

loadTable();