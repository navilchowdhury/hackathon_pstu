import api from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  updateProfile: (payload) => api.put('/auth/profile', payload),
  changePassword: (payload) => api.put('/auth/password', payload),
};

export const walletApi = {
  get: () => api.get('/wallet'),
  history: (params) => api.get('/wallet/history', { params }),
  analytics: () => api.get('/wallet/analytics'),
};

export const transactionApi = {
  send: (payload) => api.post('/transactions/send', payload),
  list: (params) => api.get('/transactions', { params }),
  get: (id) => api.get(`/transactions/${id}`),
  reverse: (id) => api.put(`/transactions/reverse/${id}`),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/read/${id}`),
  markAll: () => api.put('/notifications/read/all'),
};

export const groupApi = {
  list: () => api.get('/groups'),
  create: (payload) => api.post('/groups', payload),
  get: (id) => api.get(`/groups/${id}`),
  addMember: (id, payload) => api.post(`/groups/${id}/members`, payload),
  addExpense: (id, payload) => api.post(`/groups/${id}/expenses`, payload),
  removeExpense: (id, expenseId) => api.delete(`/groups/${id}/expenses/${expenseId}`),
  pay: (id, settlementId, payload) =>
    api.post(`/groups/${id}/settlements/${settlementId}/pay`, payload),
  remove: (id) => api.delete(`/groups/${id}`),
};

export const adminApi = {
  users: (params) => api.get('/admin/users', { params }),
  statistics: () => api.get('/admin/statistics'),
  transactions: (params) => api.get('/admin/transactions', { params }),
};
