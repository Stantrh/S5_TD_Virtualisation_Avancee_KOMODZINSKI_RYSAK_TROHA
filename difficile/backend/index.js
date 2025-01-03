const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');



const app = express();

// Middleware CORS pour autoriser le frontend
app.use(cors({
   origin: 'http://localhost:5173',
 }));


// URL de connexion avec les identifiants qu'on a défini dans le docker compose. On utilise le nom du service "database" pour le contacter.
const mongoUrl = 'mongodb://admin:secret@database:27017/TD5?authSource=admin';

// Connexion grâce à Mongoose
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

app.get('/databases', async (req, res) => {
  try {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const databases = await client.db().admin().listDatabases();
    res.json(databases);
    await client.close();
  } catch (err) {
    console.error('Failed to list databases:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Coucou du backend, bien connecté à MongoDB !');
});

app.listen(3000, () => console.log('Backend sur le port 3000'));
