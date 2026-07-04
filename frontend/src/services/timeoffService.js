import api from './api';

const timeoffService = {
  apply: async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    const response = await api.post('/timeoff/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getMyLeaves: async (params = {}) => {
    const response = await api.get('/timeoff/my', { params });
    return response.data;
  },

  getAllLeaves: async (params = {}) => {
    const response = await api.get('/timeoff', { params });
    return response.data;
  },

  updateStatus: async (id, data) => {
    const response = await api.put(`/timeoff/${id}/status`, data);
    return response.data;
  },

  getAllocations: async (params = {}) => {
    const response = await api.get('/timeoff/allocations', { params });
    return response.data;
  },

  updateAllocation: async (id, data) => {
    const response = await api.put(`/timeoff/allocations/${id}`, data);
    return response.data;
  }
};

export default timeoffService;