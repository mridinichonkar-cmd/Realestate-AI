function cleanText(text) {
  if (!text) return null;
  return text.replace(/\s+/g, " ").trim();
}

function firstMatchingText(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = cleanText(el.innerText || el.textContent);
      if (text) return text;
    }
  }
  return null;
}

function extractNumber(text) {
  if (!text) return null;

  const match = text.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function firstImage() {
  const img = document.querySelector("img");
  return img ? img.src : null;
}

function extractPrimaryFeatures() {
  const container = document.querySelector('ul.property-info__primary-features');

  if (!container) {
    return {
      type: null,
      num_bed: null,
      num_bath: null,
      num_parking: null
    };
  }

  const aria = container.getAttribute("aria-label") || "";
  const text = cleanText(aria);

  if (!text) {
    return {
      type: null,
      num_bed: null,
      num_bath: null,
      num_parking: null
    };
  }

  const typeMatch = text.match(/^(.+?)\s+with/i);
  const bedMatch = text.match(/(\d+)\s+bedroom/i);
  const bathMatch = text.match(/(\d+)\s+bathroom/i);
  const parkingMatch = text.match(/(\d+)\s+(car space|garage|parking)/i);

  return {
    type: typeMatch ? cleanText(typeMatch[1]) : null,
    num_bed: bedMatch ? Number(bedMatch[1]) : null,
    num_bath: bathMatch ? Number(bathMatch[1]) : null,
    num_parking: parkingMatch ? Number(parkingMatch[1]) : null
  };

}



function extractSuburb(address) {
  if (!address) return null;

  const parts = address.split(",");
  if (parts.length >= 2) {
    return cleanText(parts[1]);
  }
  return null;
}

function extractTypeFromUrl(url) {
  if (!url) return null;

  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("property-house-")) return "House";
  if (lowerUrl.includes("property-villa-")) return "Villa";
  if (lowerUrl.includes("property-townhouse-")) return "Townhouse";
  if (lowerUrl.includes("property-duplex-")) return "Duplex";
  if (lowerUrl.includes("property-apartment-")) return "Apartment / Unit / Flat";
  if (lowerUrl.includes("property-unit-")) return "Apartment / Unit / Flat";
  if (lowerUrl.includes("property-flat-")) return "Apartment / Unit / Flat";

  return null;
}

function extractPropertySize(pageText) {
  if (!pageText) return null;

  const match = pageText.match(/(\d+(?:\.\d+)?)\s*m²/i);
  if (match) return Number(match[1]);

  return null;
}

function extractPropertyData() {
  const title = firstMatchingText([
    "h1",
    '[data-testid="listing-details__summary-title"]',
    '[data-testid="listing-title"]',
    ".property-info-address",
    ".css-1texeil"
  ]);

  const address = firstMatchingText([
    "address",
    '[data-testid="address-label"]',
    ".property-info-address",
    ".css-164r41r"
  ]);

  const priceText = firstMatchingText([
    '[data-testid="listing-details__price"]',
    '[data-testid="price"]',
    ".property-price",
    ".css-mgq8yx"
  ]);

  const primaryFeatures = extractPrimaryFeatures();

  const description = firstMatchingText([
    '[data-testid="listing-details__description"]',
    '[data-testid="description"]',
    ".property-description"
  ]);

  const sizeText = firstMatchingText([
    '[data-testid="property-features-feature-land-size"]',
    '[data-testid="property-size"]',
    ".property-info-feature-land-size"
  ]);

  const pageText = cleanText(document.body.innerText || "").toLowerCase();

  const data = {
    listing_url: window.location.href,
    title: title,
    address: address,
    suburb: extractSuburb(address),
    listed_price: extractNumber(priceText),
    num_bed: primaryFeatures.num_bed,
    num_bath: primaryFeatures.num_bath,
    num_parking: primaryFeatures.num_parking,
    property_size: extractNumber(sizeText) || extractPropertySize(pageText),
    type: extractTypeFromUrl(window.location.href),
    predicted_price: null,
    difference: null,
    verdict: null,
    description_snippet: description ? description.slice(0, 200) : null,
    image_url: firstImage(),
    saved_at: new Date().toISOString(),
    status: "saved",
    notes: ""
  };

  return data;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_PROPERTY") {
    try {
      const data = extractPropertyData();

      if (!data) {
        sendResponse({
          success: false,
          error: "Could not detect property details on this page."
        });
        return true;
      }

      sendResponse({
        success: true,
        data: data
      });
      return true;
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
      return true;
    }
  }
});