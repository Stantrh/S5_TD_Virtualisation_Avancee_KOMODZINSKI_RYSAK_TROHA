<template>
  <div id="app">
    <h1>Frontend</h1>
    <p>Message du backend: <strong>{{ message }}</strong></p>
    <button @click="toggleDatabases">
      {{ showDatabases ? 'Replier' : 'Afficher' }} les bases de données
    </button>
    <transition name="fade">
      <ul v-if="showDatabases">
        <li v-for="db in databases" :key="db.name" class="database-item">
          <span>{{ db.name }}</span>
          <small>(taille : {{ db.sizeOnDisk }} octets)</small>
        </li>
      </ul>
    </transition>
  </div>
</template>

<script>
import { getDatabases } from './api'; // On importe pour les bases de données
import axios from 'axios'; // On importe directement axios pour le message

export default {
  data() {
    return {
      message: '', // Pour afficher le message du backend
      databases: [], // Pour la liste des bases de données
      showDatabases: false, // État pour déplier/replier la liste
    };
  },
  async mounted() {
    try {
      // Appel pour récupérer le message brut du backend
      const response = await axios.get('http://localhost:3000'); // Pas besoin de passer par api.js ici
      this.message = response.data; // Stocke la réponse brute dans "message"
    } catch (error) {
      console.error('Failed to fetch message from backend:', error);
    }
  },
  methods: {
    // Méthode pour afficher/replier la liste
    async toggleDatabases() {
      if (!this.showDatabases) {
        try {
          const response = await getDatabases(); // Utilisation centralisée via api.js
          this.databases = response.data.databases || []; // Stocke les bases de données
        } catch (error) {
          console.error('Failed to fetch databases:', error);
        }
      }
      this.showDatabases = !this.showDatabases; // Bascule l'état
    },
  },
};
</script>

<style>
/* Thème sombre */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #121212; /* Fond sombre */
  color: #e0e0e0; /* Texte clair */
}

/* Conteneur principal */
#app {
  text-align: center;
  padding: 20px;
  background: #1e1e1e; /* Conteneur légèrement plus clair */
  border: 1px solid #333;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Bouton */
button {
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  margin-top: 10px;
}

button:hover {
  background: #388e3c;
}

/* Liste */
ul {
  list-style: none;
  padding: 0;
  margin: 20px 0 0;
}

.database-item {
  background: #2e2e2e; /* Lignes des bases */
  margin: 10px 0;
  padding: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Animation pour déplier/replier */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
