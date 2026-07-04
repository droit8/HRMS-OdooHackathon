import api from './api';

const attendanceService = {
  checkIn: async () => {
    const response = await api.post('/attendance/checkin');
    return response.data;
  },

  checkOut: async () => {
    const response = await api.post('/attendance/checkout');
    return response.data;
  },

  getMyAttendance: async (params = {}) => {
    const response = await api.get('/attendance/my', { params });
    return response.data;
  },

  getAllAttendance: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/attendance/status');
    return response.data;
  }
};

export default attendanceService;