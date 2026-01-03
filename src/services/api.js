import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

API.interceptors.request.use(req => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.authorization = token;
  }
  return req;
});

API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;
