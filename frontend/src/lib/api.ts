import axios from 'axios';
const API_BASE = 'http://localhost:5000/api';

export const api = {
  getPendingSOs: () => axios.get(`${API_BASE}/so-list`).then(r => r.data),
  getSODetails: (so: string) => axios.get(`${API_BASE}/so-details/${so}`).then(r => r.data),
  startPicking: (so: string) => axios.post(`${API_BASE}/start-picking/${so}`).then(r => r.data.success),
  submit: (so: string, errors: any[]) => axios.post(`${API_BASE}/submit/${so}`, { errors }).then(r => r.data),
  getSKUMaster: (): Promise<{ SKU: string; Name: string }[]> =>  axios.get(`${API_BASE}/sku-master`).then(r => r.data),
};