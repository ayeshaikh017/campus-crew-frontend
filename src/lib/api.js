import axios from 'axios';
const api = axios.create({baseURL:import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',withCredentials:true,headers:{'Content-Type':'application/json'}});
api.interceptors.response.use(r=>r,err=>{if(err.response?.status===401 && !/\/auth\/(login|register|verify-email|verify-reset-otp|reset-password)/.test(err.config?.url||'')){window.dispatchEvent(new Event('campuscrew:unauthorized'));}return Promise.reject(err)});
export const payload = r => r.data?.data ?? {};
export const errorMessage = e => e.response?.data?.message || e.message || 'Something went wrong. Please try again.';
export default api;
