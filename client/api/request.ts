import axios from 'axios';
import config from '@/config/config';

const request = axios.create({
  baseURL: config.apiConfig.api_url,
});

request.interceptors.request.use(
  (config) => {
    // no need include token
    // cause it saved in session
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default request;
