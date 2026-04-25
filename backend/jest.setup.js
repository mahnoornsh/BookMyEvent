// Load .env before any test runs so process.env.MONGO_URI is available
const path = require('path');

// Standard dotenv approach — points explicitly at backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Fallback: verify the key loaded correctly
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI not loaded! Check that backend/.env exists and contains MONGO_URI=...');
}