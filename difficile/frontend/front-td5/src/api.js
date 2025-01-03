import axios from 'axios';

// on crée l'api du backend.
const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Méthode pour récupérer les bases de données
export const getDatabases = () => api.get('/databases');

export default api;