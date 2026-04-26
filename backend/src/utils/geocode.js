const axios = require('axios');

const geocodeAddress = async (venue, city) => {
  const address = `${venue}, ${city}`;

  try {
    const response = await axios.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: address,
          format: 'json',
          limit: 1,
        },
        headers: {
          //Nominatim requires a User-Agent identifying your app
          'User-Agent': 'BookMyEvent/1.0 (student project)',
        },
      }
    );

    const results = response.data;

    if (!results || results.length === 0) {
      console.warn(`[geocode] No results for "${address}"`);
      return { lat: null, lng: null };
    }

    const lat = parseFloat(results[0].lat);
    const lng = parseFloat(results[0].lon); 
    console.log(`[geocode] "${address}" → lat: ${lat}, lng: ${lng}`);
    return { lat, lng };

  } catch (err) {
    console.error('[geocode] Network error:', err.message);
    return { lat: null, lng: null };
  }
};

module.exports = { geocodeAddress };