const { Router } = require("express");
const { searchMovie, seeMovie, movieDetails } = require("../controllers/movies.controllers.js");

const router = Router();

router.get("/api/movies/search", searchMovie);
router.get("/api/movies/details/*", movieDetails);
router.get("/api/movies/see/*", seeMovie);

module.exports = router;