import axios from axios;


const base = "localhost:8000";

const api = axios.create({
  baseURL = base,
  withCredentials: true,
  header: {
    'Content-Type': 'application/json'
  },
})

const refreshapi = axios.create({
  baseURL = base,
  withCredentials: true,
  header: {
    'Content-Type': 'application/json'
  },
})

export const setrefreshtoken = (token) {
  if (!token) delete api.defaults.headers.common['Authorization'];
  else api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const setLoading = false;
const setRefreshing = false;

api.interceptors.response.use(res) => {
  
}