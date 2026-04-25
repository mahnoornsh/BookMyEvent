/**
 * Unit tests — geocodeAddress utility
 * axios is mocked so no real API calls are made.
 * Also tests coordinate spot-checks for real venue name strings.
 */

jest.mock('axios');
const axios = require('axios');
const { geocodeAddress } = require('../utils/geocode');

const GOOD_RESPONSE = (lat, lng) => ({
  data: {
    status: 'OK',
    results: [{ geometry: { location: { lat, lng } } }],
  },
});

const EMPTY_RESPONSE = (status = 'ZERO_RESULTS') => ({
  data: { status, results: [] },
});

describe('geocodeAddress', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, GOOGLE_MAPS_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  // ── Happy path ─────────────────────────────────────────────────────────────
  test('returns lat and lng for a valid address', async () => {
    axios.get.mockResolvedValue(GOOD_RESPONSE(24.8607, 67.0011));

    const { lat, lng } = await geocodeAddress('Karachi Expo Centre', 'Karachi');

    expect(lat).toBe(24.8607);
    expect(lng).toBe(67.0011);
  });

  test('passes correct address string and API key to Google', async () => {
    axios.get.mockResolvedValue(GOOD_RESPONSE(31.5204, 74.3587));

    await geocodeAddress('Alhamra Arts Council', 'Lahore');

    expect(axios.get).toHaveBeenCalledWith(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: 'Alhamra Arts Council, Lahore',
          key: 'test-api-key',
        },
      }
    );
  });

  // ── Graceful failures ──────────────────────────────────────────────────────
  test('returns null/null when status is ZERO_RESULTS', async () => {
    axios.get.mockResolvedValue(EMPTY_RESPONSE('ZERO_RESULTS'));

    const { lat, lng } = await geocodeAddress('Fake Venue', 'Nowhere');

    expect(lat).toBeNull();
    expect(lng).toBeNull();
  });

  test('returns null/null when status is REQUEST_DENIED', async () => {
    axios.get.mockResolvedValue(EMPTY_RESPONSE('REQUEST_DENIED'));

    const { lat, lng } = await geocodeAddress('Some Venue', 'City');

    expect(lat).toBeNull();
    expect(lng).toBeNull();
  });

  test('returns null/null on network error', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    const { lat, lng } = await geocodeAddress('Expo Centre', 'Karachi');

    expect(lat).toBeNull();
    expect(lng).toBeNull();
  });

  test('returns null/null and skips API call when GOOGLE_MAPS_API_KEY is missing', async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;

    const { lat, lng } = await geocodeAddress('Lahore Fort', 'Lahore');

    expect(lat).toBeNull();
    expect(lng).toBeNull();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('returns null/null when results array is empty', async () => {
    axios.get.mockResolvedValue({ data: { status: 'OK', results: [] } });

    const { lat, lng } = await geocodeAddress('Ghost Venue', 'Ghost City');

    expect(lat).toBeNull();
    expect(lng).toBeNull();
  });

  // ── Venue spot-checks (verifies address string construction) ───────────────
  const venues = [
    { venue: 'Karachi Expo Centre',    city: 'Karachi',   expectedLat: 24.8607, expectedLng: 67.0011 },
    { venue: 'Alhamra Arts Council',   city: 'Lahore',    expectedLat: 31.5204, expectedLng: 74.3587 },
    { venue: 'Pakistan Monument',      city: 'Islamabad', expectedLat: 33.6938, expectedLng: 73.0652 },
    { venue: 'Pearl Continental Hotel',city: 'Peshawar',  expectedLat: 34.0151, expectedLng: 71.5249 },
    { venue: 'Bagh-e-Jinnah',          city: 'Lahore',    expectedLat: 31.5497, expectedLng: 74.3436 },
  ];

  venues.forEach(({ venue, city, expectedLat, expectedLng }) => {
    test(`correctly geocodes: ${venue}, ${city}`, async () => {
      axios.get.mockResolvedValue(GOOD_RESPONSE(expectedLat, expectedLng));

      const { lat, lng } = await geocodeAddress(venue, city);

      expect(lat).toBe(expectedLat);
      expect(lng).toBe(expectedLng);

      // Verify the address string passed to Google is correct
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            address: `${venue}, ${city}`,
          }),
        })
      );
    });
  });
});