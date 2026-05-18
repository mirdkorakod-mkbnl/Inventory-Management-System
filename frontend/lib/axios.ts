import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// 1. กำหนด Base URL จาก Environment Variable (ถ้าไม่มีให้ใช้ localhost)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// 2. สร้าง Instance ของ Axios
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // รอสูงสุด 10 วินาที ถ้าเกินให้ตัดจบ (ป้องกันหน้าเว็บค้าง)
});

// ============================================================
// 3. Request Interceptor (ตัวดักจับขาก่อนส่ง)
// หน้าที่: แอบยัด Token ใส่กระเป๋าไปด้วยทุกครั้ง
// ============================================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // เช็คว่าเป็น Browser หรือไม่ (เพราะ Next.js มีฝั่ง Server ด้วย)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token'); // ดึง Token จาก LocalStorage
      
      if (token && config.headers) {
        // แนบ Token ไปใน Header: Authorization
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================================================
// 4. Response Interceptor (ตัวดักจับขาตอบกลับ)
// หน้าที่: เช็คว่า Token หมดอายุไหม? ถ้าหมดให้ถีบออกไปหน้า Login
// ============================================================
api.interceptors.response.use(
  (response) => {
    // ถ้าสำเร็จ (Status 2xx) ก็ปล่อยผ่านไป
    return response;
  },
  (error: AxiosError) => {
    // เช็คว่า Error เป็น 401 (Unauthorized) หรือไม่?
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        // ถ้าไม่ใช่หน้า Login อยู่แล้ว ให้เคลียร์ Token และดีดไปหน้า Login
        // เพื่อป้องกัน Loop นรก
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('token');
          // ใช้ window.location เพื่อ Force Reload หน้าใหม่ให้สะอาด
          window.location.href = '/login'; 
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;