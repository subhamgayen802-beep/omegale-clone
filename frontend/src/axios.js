import axios from "axios";

const api = axios.create({
  baseURL: "https://omegale-clone.onrender.com"|| "http://localhost:5000",
  withCredentials: true
});

export default api;