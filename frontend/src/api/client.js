import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;
const api = axios.create({ baseURL: API_BASE });

export const researchApi = {
  run: (data) => api.post('/research/run', data),
  getStats: () => api.get('/research/stats'),
  getHistory: () => api.get('/research/history'),
  getTask: (id) => api.get(`/research/${id}`),
  deleteTask: (id) => api.delete(`/research/${id}`),
  exportTask: (taskId, format) => {
    const url = `${API_BASE}/research/${taskId}/export?format=${format}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `research_${taskId.slice(0, 8)}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
  previewPrompt: (config) => api.post('/research/preview-prompt', config),
};

export const templatesApi = {
  getAll: () => api.get('/templates'),
  save: (data) => api.post('/templates', data),
  delete: (id) => api.delete(`/templates/${id}`),
};
