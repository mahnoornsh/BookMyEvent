//note: axios is mocked, no real HTTP calls are made.

jest.mock('axios');
const axios = require('axios');
const { geocodeAddress } = require('../utils/geocode');

//Helper to build a Nominatim-style response 
const nominatimResponse = (lat, lon) => ({
  data: [{ lat: String(lat), lon: String(lon), display_name: 'Some Place' }],
});

const emptyResponse = { data: [] };


describe('geocodeAddress', () => {

  beforeEach(() => jest.clearAllMocks());

  test('returns lat and lng for a valid address', async () => {
    axios.get.mockResolvedValue(nominatimResponse(24.8607, 67.0011));

    const { lat, lng } = await geocodeAddress('Karachi Expo Centre', 'Karachi');

    expect(lat).toBe(24.8607);
    expect(lng).toBe(67.0011);
  });

  test('calls Nominatim with correct params and User-Agent', async () => {
    axios.get.mockResolvedValue(nominatimResponse(31.5204, 74.3587));

    await geocodeAddress('Alhamra Arts Council', 'Lahore');

    expect(axios.get).toHaveBeenCalledWith(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: 'Alhamra Arts Council, Lahore',
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'BookMyEvent/1.0 (student project)',
        },
      }
    );
  });

  // Failure cases
  test('returns null/null when results array is empty', async () => {
    axios.get.mockResolvedValue(emptyResponse);

    const { lat, lng } = await geocodeAddress('Fake Venue', 'Nowhere');

    expect(lat).toBeNull();
    expect(lng).toBeNull();
  });

  test('returns null/null on network error', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    const { lat, lng } = await geocodeAddress('Some Venue', 'City');

    expect(lat).toBeNull();
    expect(lng).toBeNull();
  });

  test('returns null/null when data is undefined', async () => {
    axios.get.mockResolvedValue({ data: undefined });

    const { lat, lng } = await geocodeAddress('Ghost Venue', 'Ghost City');

    expect(lat).toBeNull();
    expect(lng).toBeNull();
  });

  //Correctly geocodes real Pakistani venues (mocked)
  const venues = [
    { venue:'Expo Centre', city: 'Karachi', expectedLat: 24.8607, expectedLng: 67.0011 },
    { venue:'Alhamra Arts Council', city: 'Lahore', expectedLat: 31.5204, expectedLng: 74.3587 },
    { venue:'Pakistan Monument', city: 'Islamabad', expectedLat: 33.6938, expectedLng: 73.0652 },
    { venue:'Pearl Continental Hotel', city: 'Peshawar', expectedLat: 34.0151, expectedLng: 71.5249 },
    { venue:'Bagh-e-Jinnah', city: 'Lahore', expectedLat: 31.5497, expectedLng: 74.3436 },
  ];

  test.each(venues)(
    'correctly geocodes: $venue, $city',
    async ({ venue, city, expectedLat, expectedLng }) => {
      axios.get.mockResolvedValue(nominatimResponse(expectedLat, expectedLng));

      const { lat, lng } = await geocodeAddress(venue, city);

      expect(lat).toBe(expectedLat);
      expect(lng).toBe(expectedLng);

      //Verify the address string is built correctly
      expect(axios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search',
        expect.objectContaining({
          params: expect.objectContaining({
            q: `${venue}, ${city}`,
          }),
        })
      );
    }
  );

});