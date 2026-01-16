import axios from 'axios';

const userBaseURL = process.env.NEXT_PUBLIC_USER_BACKEND_BASE_URL || 'http://localhost:8050';
const doctorBaseURL = process.env.NEXT_PUBLIC_DOCTOR_BACKEND_BASE_URL || 'http://localhost:8050';
const microserviceBaseURL = process.env.NEXT_PUBLIC_MICROSEVICE_BASE_URL || "http://localhost:7050";

const userApi = axios.create({ baseURL: userBaseURL });
const doctorApi = axios.create({ baseURL: doctorBaseURL });
const microserviceApi = axios.create({ baseURL: microserviceBaseURL });

[userApi, doctorApi].forEach((instance) =>
    instance.interceptors.request.use((config) => {
        const token = sessionStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    })
);

export {
    userApi,
    doctorApi,
    microserviceApi
}