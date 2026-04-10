import axios from 'axios';

//backend runs on port 8000 [from backend/.env PORT=8000]
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
});

//automatically attaches JWT token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('bme_token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

//handles expired/invalid token globally — redirects to login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bme_token');
      localStorage.removeItem('bme_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
export default API;
