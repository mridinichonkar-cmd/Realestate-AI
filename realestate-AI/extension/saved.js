const tableContainer = document.getElementById("tableContainer");
const refreshBtn = document.getElementById("refreshBtn");
const clearBtn = document.getElementById("clearBtn");

async function getSavedProperties() {
  const result = await chrome.storage.local.get(["savedProperties"]);
  return result.savedProperties || [];
}

async function saveAllProperties(properties) {
  await chrome.storage.local.set({ savedProperties: properties });
}


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

function createTable(properties) {
  if (!properties.length) {
    tableContainer.innerHTML = `<div class="empty">No saved listings yet.</div>`;
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Address</th>
          <th>Listed Price</th>
          <th>Beds</th>
          <th>Baths</th>
          <th>Parking</th>
          <th>Size</th>
          <th>Type</th>
          <th>Predicted Price</th>
          <th>Difference</th>
          <th>Verdict</th>
          <th>Notes</th>
          <th>Link</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  properties.forEach((property, index) => {
    html += `
      <tr>
    <td>${formatValue(property.title)}</td>
    <td>${formatValue(property.address)}</td>

    <td>
      <input class="edit-input" data-index="${index}" data-field="listed_price"
        value="${property.listed_price ?? property.rent_weekly ?? ""}">
    </td>

    <td>
      <input class="edit-input" data-index="${index}" data-field="num_bed"
        value="${property.num_bed ?? property.bedrooms ?? ""}">
    </td>

    <td>
      <input class="edit-input" data-index="${index}" data-field="num_bath"
        value="${property.num_bath ?? property.bathrooms ?? ""}">
    </td>

    <td>
      <input class="edit-input" data-index="${index}" data-field="num_parking"
        value="${property.num_parking ?? property.parking_spaces ?? ""}">
    </td>

    <td>
      <input class="edit-input" data-index="${index}" data-field="property_size"
        value="${property.property_size ?? ""}">
    </td>

    <td>
      <select class="edit-input" data-index="${index}" data-field="type">
        <option value="">Select</option>
        <option value="House" ${property.type === "House" ? "selected" : ""}>House</option>
        <option value="Apartment" ${property.type === "Apartment" ? "selected" : ""}>Apartment</option>
        <option value="Townhouse" ${property.type === "Townhouse" ? "selected" : ""}>Townhouse</option>
        <option value="Unit" ${property.type === "Unit" ? "selected" : ""}>Unit</option>
        <option value="Other" ${property.type === "Other" ? "selected" : ""}>Other</option>
      </select>
    </td>

    <td>${formatCurrency(property.predicted_price)}</td>
    <td>${formatCurrency(property.difference)}</td>
    <td>${formatValue(property.verdict)}</td>

    <td>
      <textarea class="notes-box" data-index="${index}">${property.notes || ""}</textarea>
      <button class="small-btn save-notes-btn" data-index="${index}">Save Notes</button>
    </td>

    <td class="link-cell">
      <a href="${property.listing_url}" target="_blank">Open listing</a>
    </td>

    <td>
      <button class="small-btn predict-btn" data-index="${index}">Predict</button>
      <button class="small-btn delete-btn" data-index="${index}">Delete</button>
    </td>
  </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

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
    
    try{
      const payload = {
        suburb: property.suburb,
        type: property.type,
        num_bath: property.num_bath,
        num_bed: property.num_bed,
        num_parking: property.num_parking,
        property_size: property.property_size,
        listed_price: property.listed_price,

        // temporary defaults until backend lookup is added
        suburb_median_income: property.suburb_median_income ?? 45000,
        cash_rate: property.cash_rate ?? 4.1,
        km_from_cbd: property.km_from_cbd ?? 37
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

  statusSelects.forEach((select) => {
    select.addEventListener("change", async (event) => {
      const index = Number(event.target.dataset.index);
      properties[index].status = event.target.value;
      await saveAllProperties(properties);
    });
  });
}

async function loadTable() {
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