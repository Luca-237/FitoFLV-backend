const animeflv = require("animeflv-api");
const cloudscraper = require("cloudscraper");
const cheerio = require("cheerio");

const getAnimes = async (req, res) => {
  try {
    const data = await animeflv.searchAnimesByFilter({ statuses: ["En emisión"] });
    const animesList = data.data || data || [];

    let animes = animesList.map((anime) => {
      const safeId = anime.id || anime.slug || (anime.title ? anime.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : "");
      
      return {
        name: safeId,
        img: anime.cover || anime.poster || "",
        dubbing: "Sub Español",
      };
    });

    if (animes.length > 0) {
      return res.status(200).json(animes);
    } else {
      return res.status(404).json({ message: "No se encontraron animes." });
    }
  } catch (error) {
    console.error("❌ Error en getAnimes:", error.message);
    res.status(500).json({ error: error.message });
  }
};


const animeDetails = async (req, res) => {
  try {
    const { anime } = req.params;
    console.log(`Buscando detalles de: ${anime}...`);
    
    const url = `https://www3.animeflv.net/anime/${anime}`;
    const html = await cloudscraper({
        uri: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'Cache-Control': 'private',
            'Referer': 'https://www.google.com/search?q=animeflv'
        }
    });
    
    const $ = cheerio.load(html);


    const title = $('h1.Title').text() || anime;
    const description = $('div.Description p').text() || "Sinopsis no disponible.";
    const status = $('aside p.AnmStts span').text() || "Finalizado";
    

    let img = $('div.AnimeCover div.Image figure img').attr('src') || $('div.Image img').attr('src') || "";

    if (img && img.startsWith('/')) {
        img = `https://www3.animeflv.net${img}`;
    }
    
    let genres = [];
    $('nav.Nvgnrs a').each((i, el) => {
        genres.push($(el).text());
    });


    let episodeList = [];
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && scriptContent.includes('var episodes = [')) {
            const match = scriptContent.match(/var episodes = (\[.*\]);/);
            if (match && match[1]) {
                try {
                    const episodesArray = JSON.parse(match[1]);
              
                    episodeList = episodesArray.map(ep => `Episodio ${ep[0]}`);
                } catch (e) {
                    console.error("❌ Error al parsear episodios:", e.message);
                }
            }
        }
    });
    if (!title && episodeList.length === 0) {
      return res.status(404).json({ message: `No hay detalles para ${anime}` });
    }

    let details = [{
      name: title,
      genres: genres,
      information: [status, ...episodeList],
      description: description,
      img: img 
    }];

    console.log("✅ Detalles extraídos exitosamente.");
    return res.status(200).json(details);
    
  } catch (error) {
    console.error("❌ Error en animeDetails:", error.message);
    
    if (error.statusCode === 404) {
       return res.status(404).json({ message: `El anime '${req.params.anime}' no existe en AnimeFLV.` });
    }
    
    return res.status(500).json({ error: error.message });
  }
};


const seeAnime = async (req, res) => {
  try {
    const { anime, episode } = req.params;
    
    const episodeId = `${anime}-${episode}`;
    const url = `https://www3.animeflv.net/ver/${episodeId}`;

    const html = await cloudscraper({
        uri: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'Cache-Control': 'private',
            'Referer': 'https://www.google.com/search?q=animeflv'
        }
    });

    const $ = cheerio.load(html);
    let servers = [];

    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && scriptContent.includes('var videos = {')) {
            const match = scriptContent.match(/var videos = (\{.*\});/);
            if (match && match[1]) {
                try {
                    const videosJson = JSON.parse(match[1]);
                    if (videosJson.SUB) {
                        servers = videosJson.SUB;
                    }
                } catch (e) {
                    console.error("❌ Error al parsear videos:", e.message);
                }
            }
        }
    });

    if (servers.length === 0) {
      return res.status(404).json({ message: `No se encontraron enlaces para el episodio ${episodeId}.` });
    }


    let links = servers.map((server) => {
      let videoUrl = server.code || server.url;
      
 
      if (videoUrl && videoUrl.includes('<iframe')) {
          const srcMatch = videoUrl.match(/src="([^"]+)"/);
          if (srcMatch && srcMatch[1]) {
              videoUrl = srcMatch[1];
          }
      }
      
      return {
        server: server.title,
        link: videoUrl
      };
    });

    return res.status(200).json(links);
  } catch (error) {
    console.error("❌ Error en seeAnime:", error.message);
    
    if (error.statusCode === 404) {
       return res.status(404).json({ message: `El episodio no existe en AnimeFLV.` });
    }
    
    res.status(500).json({ error: error.message });
  }
};


const searchAnime = async (req, res) => {
  try {
    const query = req.query.q || req.params.word || req.params.id || "naruto";
    console.log(`Buscando el término: ${query}`);
    
    const data = await animeflv.searchAnime(query);
    const animesList = data.data || data || [];

    let results = animesList.map((anime) => {
      const safeId = anime.id || anime.slug || (anime.title ? anime.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : "");
      
      return {
        id: safeId,
        title: anime.title,
        img: anime.cover || anime.poster || ""
      };
    });

    if (results.length > 0) {
      return res.status(200).json(results);
    } else {
      return res.status(404).json({ message: `No se encontraron resultados para ${query}` });
    }
  } catch (error) {
    console.error("❌ Error en searchAnime:", error.message);
    res.status(500).json({ error: error.message });
  }
};


const getAnimesByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    console.log(`Buscando por género: ${genre}`);
    
    const data = await animeflv.searchAnimesByFilter({ genres: [genre] });
    const animesList = data.data || data || [];

    let results = animesList.map((anime) => {
      const safeId = anime.id || anime.slug || (anime.title ? anime.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : "");
      return {
        id: safeId,
        title: anime.title,
        img: anime.cover || anime.poster || ""
      };
    });

    if (results.length > 0) {
      return res.status(200).json(results);
    } else {
      return res.status(404).json({ message: `No se encontraron resultados para el género ${genre}` });
    }
  } catch (error) {
    console.error("❌ Error en getAnimesByGenre:", error.message);
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  getAnimes,
  seeAnime,
  animeDetails,
  searchAnime,
  getAnimesByGenre 
};

