import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE;

export const api = {
  getPendingSOs: async () => {
    const res = await axios.get(`${API_BASE}/so-list`);
    return res.data;
  },

  getSODetails: async (so:any) => {
    const res = await axios.get(`${API_BASE}/so-details/${so}`);
    return res.data;
  },

  startPicking: async (so:any) => {
    const res = await axios.post(`${API_BASE}/start-picking/${so}`);
    return res.data.success;
  },

  submit: async (so:any, errors:any) => {
    const res = await axios.post(`${API_BASE}/submit/${so}`, { errors });
    return res.data;
  },

  getSKUMaster: async () => {
    const res = await axios.get(`${API_BASE}/sku-master`);
    return res.data;
  },
};