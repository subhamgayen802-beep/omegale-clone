import axios from "axios";

const api = axios.create({
  baseURL: "https://omegale-clone.onrender.com/api",
  withCredentials: true
});

export default api;