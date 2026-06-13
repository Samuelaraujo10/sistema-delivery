import axios from 'axios';

let finalBaseUrl = '/api';
if (import.meta.env.VITE_API_URL) {
  // Remove barra final se existir e garante que o /api está presente
  const cleanUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
  finalBaseUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
}

const api = axios.create({
  baseURL: finalBaseUrl,
});

// Interceptor para token
api.interceptors.request.use((config) => {
  const auth = JSON.parse(sessionStorage.getItem('delivery-auth') || '{}');
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

    if (error.response?.status === 401) {
      // Token expirado ou inválido: deslogar e redirecionar
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
      import('react-hot-toast').then(({ toast }) => {
        toast.error('Sessão expirada. Faça login novamente.');
      });
      window.location.href = '/login';
    } else {
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
  getOrders: (id) => api.get('/orders', { params: { establishmentId: id } }),
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
  // Delete a category (soft delete)
  delete: (id) => api.delete(`/categories/${id}`),
};

export const ordersAPI = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  userOrders: (userId) => api.get(`/orders/user/${userId}`),
  notifyPix: (id) => api.post(`/orders/${id}/notify-pix`),
};

export const reviewsAPI = {
  create: (data) => api.post('/reviews', data),
  getByEstablishment: (id) => api.get(`/reviews/establishment/${id}`),
  getByProduct: (id) => api.get(`/reviews/product/${id}`)
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export default api;
