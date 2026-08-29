import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('securepay_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('securepay_token');
      const path = window.location.pathname;
      if (!['/login', '/register', '/'].includes(path)) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export function extractError(error) {
  if (!error.response) {
    return 'Cannot reach the API. Start the backend with npm run dev in the backend folder (port 5000).';
  }
  return error.response.data?.message || error.message || 'Something went wrong';
}

export default api;
