import axios from 'axios';

// Token auth: the token lives in localStorage and is sent as a Bearer header.
// Cookies alone fail on other devices/browsers because the frontend and backend
// are on different domains (third-party cookies get blocked).
const KEY = 'campuscrew_token';
export const getToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { /* storage blocked */ } };

const api = axios.create({baseURL:import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',withCredentials:true,headers:{'Content-Type':'application/json'}});
api.interceptors.request.use(c=>{const t=getToken();if(t)c.headers.Authorization=`Bearer ${t}`;return c});
api.interceptors.response.use(r=>r,err=>{if(err.response?.status===401 && !/\/auth\/(login|register|verify-email|verify-reset-otp|reset-password)/.test(err.config?.url||'')){setToken(null);window.dispatchEvent(new Event('campuscrew:unauthorized'));}return Promise.reject(err)});
export const payload = r => r.data?.data ?? {};
export const errorMessage = e => e.response?.data?.message || e.message || 'Something went wrong. Please try again.';
export default api;
