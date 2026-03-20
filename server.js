const express = require("express");
const cors = require("cors");

const { PORT } = require("./config.js");
const animeRoutes = require("./routes/animes.routes.js");
const movieRoutes = require("./routes/movies.routes.js"); 

const app = express();

app.use(cors());
app.use(express.json());

// Importante: El orden no debería afectar, pero aquí están ambos
app.use(animeRoutes);
app.use(movieRoutes); 

app.listen(PORT, () => {
    console.log(`🚀 Servidor FitoFLV listo en puerto: ${PORT}`);
    console.log(`🎥 Rutas de películas activas en /api/movies/search`);
});