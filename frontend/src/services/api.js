import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Interceptor para token
api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('delivery-auth') || '{}');
  const token = auth?.state?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Interceptor para erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Erro inesperado no servidor';
    const errors = error.response?.data?.errors;

    if (error.response?.status !== 401) { // 401 é tratado no login/auth
      import('react-hot-toast').then(({ toast }) => {
        toast.error(message);
        if (errors) {
          errors.forEach(err => console.error(`[Validation] ${err.path}: ${err.message}`));
        }
      });
    }

    return Promise.reject(error);
  }
);

// API methods
export const establishmentsAPI = {
  list: (params) => api.get('/establishments', { params }),
  getBySlug: (slug, params) => api.get(`/establishments/${slug}`, { params }),
  create: (data) => api.post('/establishments', data),
  update: (id, data) => api.put(`/establishments/${id}`, data),
  delete: (id) => api.delete(`/establishments/${id}`),
};

export const productsAPI = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  builderItems: (establishmentId) => api.get(`/products/builder-items/${establishmentId}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const categoriesAPI = {
  list: (params) => api.get('/categories', { params }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
};

export const ordersAPI = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  userOrders: (userId) => api.get(`/orders/user/${userId}`),
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export default api;
