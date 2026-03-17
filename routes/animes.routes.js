const { Router } = require("express");
const {
  getAnimes,
  seeAnime,
  animeDetails,
  searchAnime, 
  getAnimesByGenre,
} = require("../controllers/animes.controllers.js");

const router = Router();

router.get("/api/animes/:page", getAnimes);
router.get("/api/see/:anime/:episode", seeAnime);
router.get("/api/details/:anime", animeDetails);
router.get("/api/genre/:genre", getAnimesByGenre);

// 2. Creamos la ruta para la búsqueda
// Usamos /api/search para mantener el mismo estilo que las demás rutas
router.get("/api/search", searchAnime);

module.exports = router;