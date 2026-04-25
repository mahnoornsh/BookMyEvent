const axios = require('axios');

/**
 * Given a venue and city string, calls the Google Geocoding API
 * and returns { lat, lng }. Returns { lat: null, lng: null } on failure.
 */
const geocodeAddress = async (venue, city) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const address = `${venue}, ${city}`;

  if (!apiKey) {
    console.warn('[geocode] GOOGLE_MAPS_API_KEY not set — skipping geocoding');
    return { lat: null, lng: null };
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      { params: { address, key: apiKey } }
    );

    const { status, results } = response.data;

    if (status !== 'OK' || !results || !results.length) {
      console.warn(`[geocode] Failed for "${address}" — status: ${status}`);
      return { lat: null, lng: null };
    }

    const { lat, lng } = results[0].geometry.location;
    console.log(`[geocode] "${address}" → lat: ${lat}, lng: ${lng}`);
    return { lat, lng };

  } catch (err) {
    console.error('[geocode] Network error:', err.message);
    return { lat: null, lng: null };
  }
};

module.exports = { geocodeAddress };