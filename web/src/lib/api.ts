import axios from 'axios';

// Use API subdomain for production
const API_URL = 'https://api1.labsacme.com/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Clientes API
export const clientesApi = {
  getAll: () => api.get('/clientes'),
  getById: (id: number) => api.get(`/clientes/${id}`),
  create: (data: any) => api.post('/clientes', data),
  update: (id: number, data: any) => api.patch(`/clientes/${id}`, data),
  delete: (id: number) => api.delete(`/clientes/${id}`),
};

// Productos API
export const productosApi = {
  getAll: (params?: any) => api.get('/productos', { params }),
  getById: (id: number) => api.get(`/productos/${id}`),
  create: (data: any) => api.post('/productos', data),
  update: (id: number, data: any) => api.patch(`/productos/${id}`, data),
  delete: (id: number) => api.delete(`/productos/${id}`),
};

// Órdenes de Compra API
export const ocApi = {
  getAll: (params?: any) => api.get('/oc', { params }),
  getById: (id: number) => api.get(`/oc/${id}`),
  create: (data: any) => api.post('/oc', data),
  uploadFile: (formData: FormData) => api.post('/oc/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  confirmUpload: (id: number, data: any) => api.post(`/oc/${id}/confirm`, data),
  update: (id: number, data: any) => api.patch(`/oc/${id}`, data),
  changeEstado: (id: number, estado: string) =>
    api.post(`/oc/${id}/cambiar-estado`, { estado }),
};

// Órdenes de Venta API
export const ovApi = {
  getAll: (params?: any) => api.get('/ov', { params }),
  getById: (id: number) => api.get(`/ov/${id}`),
  create: (data: any) => api.post('/ov', data),
  createFromOC: (ocId: number) => api.post(`/ov/desde-oc/${ocId}`),
  update: (id: number, data: any) => api.patch(`/ov/${id}`, data),
  changeEstado: (id: number, estado: string) =>
    api.post(`/ov/${id}/cambiar-estado`, { estado }),
};

// Envíos API
export const enviosApi = {
  getAll: (params?: any) => api.get('/envios', { params }),
  getById: (id: number) => api.get(`/envios/${id}`),
  createFromOV: (ovId: number, data: any) =>
    api.post(`/envios/ov/${ovId}/crear`, data),
  addEvento: (id: number, data: any) => api.post(`/envios/${id}/eventos`, data),
  getEventos: (id: number) => api.get(`/envios/${id}/eventos`),
};

// Auditoría API
export const auditApi = {
  getAll: (params?: any) => api.get('/audit', { params }),
};
