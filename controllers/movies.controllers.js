const { searchMoviesScraper, getMovieLinks, getMovieDetails } = require("../scrapers/movies.scrapers.js");
const searchMovie = async (req, res) => {
  try {
    const query = req.query.q || "";
    if (!query) {
        return res.status(400).json({ message: "Debes proporcionar un término de búsqueda." });
    }

    console.log(`🎬 Buscando en Cuevana: ${query}`);
    const results = await searchMoviesScraper(query);

    if (results && results.length > 0) {
      console.log(`✅ Éxito: ${results.length} películas encontradas.`);
      return res.status(200).json(results);
    } else {
      console.log(`⚠️ No hubo resultados para: ${query}`);
      return res.status(404).json({ message: `No se encontraron resultados para: ${query}` });
    }
  } catch (error) {
    console.error("❌ Error en searchMovie Controller:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// --- NUEVO CONTROLADOR PARA VER LA PELÍCULA ---
const seeMovie = async (req, res) => {
    try {
        // Usamos req.params[0] para atrapar todo lo que venga después de /see/
        // Ejemplo: "pelicula/batman-forever"
        const idSlug = req.params[0]; 
        
        if (!idSlug) {
            return res.status(400).json({ message: "Falta el ID de la película." });
        }

        console.log(`🍿 Buscando enlaces para: ${idSlug}`);
        const links = await getMovieLinks(idSlug);

        if (links.length > 0) {
            console.log(`✅ Se encontraron ${links.length} servidores.`);
            return res.status(200).json(links);
        } else {
            console.log(`⚠️ No se detectaron servidores (posible cambio de selectores CSS).`);
            return res.status(404).json({ message: "No se encontraron servidores de video disponibles." });
        }
    } catch (error) {
        console.error("❌ Error en seeMovie Controller:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const movieDetails = async (req, res) => {
    try {
        const idSlug = req.params[0]; 
        if (!idSlug) return res.status(400).json({ message: "Falta el ID." });

        console.log(`📂 Buscando detalles de: ${idSlug}`);
        const details = await getMovieDetails(idSlug);

        return res.status(200).json(details);
    } catch (error) {
        console.error("❌ Error en movieDetails Controller:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { searchMovie, seeMovie, movieDetails };