const cloudscraper = require("cloudscraper");
const cheerio = require("cheerio");

const BASE_URL = 'https://cuevana.bi';

const searchMoviesScraper = async (query) => {
    try {
        console.log(`[Scraper] Accediendo a: ${BASE_URL}/explorar?s=${query}`);
        
        const html = await cloudscraper.get(`${BASE_URL}/explorar?s=${query}`);
        const $ = cheerio.load(html);
        const results = [];

        $('.movie-item').each((i, el) => {
            const anchor = $(el).find('a');
            const titleElement = $(el).find('.item-detail p');
            const imgElement = $(el).find('img.poster');

            const link = anchor.attr('href') || "";
            let title = titleElement.text().trim();
            const img = imgElement.attr('src') || imgElement.attr('data-src') || "";

            if (!title) {
                title = imgElement.attr('alt') || "Sin título";
                title = title.replace(/película\s/i, '');
            }

            if (link) {
                results.push({
                    id: link.replace(`${BASE_URL}/`, '').split('/').filter(Boolean).join('/'),
                    title: title,
                    img: img.startsWith('http') ? img : `https:${img}`,
                    type: link.includes('/pelicula/') ? 'movie' : 'serie'
                });
            }
        });

        return results;
    } catch (error) {
        console.error("Error en searchMoviesScraper:", error.message);
        return [];
    }
};

const getMovieLinks = async (idSlug) => {
    try {
        const url = `${BASE_URL}/${idSlug}`;
        console.log(`[Scraper] Obteniendo video de: ${url}`);
        
        const html = await cloudscraper.get(url);
        const $ = cheerio.load(html);
        const servers = [];

        $('.tabs-video .tab-video-item').each((i, groupEl) => {
            let language = $(groupEl).find('.tab-item-name').text();
            language = language.replace(/Calidad \· HD|Premiere/g, '').trim() || 'Desconocido';

            $(groupEl).find('li[data-server]').each((j, serverEl) => {
                const serverName = $(serverEl).find('span').first().text().trim() || `Server ${j + 1}`;
                
                const videoUrl = $(serverEl).attr('data-server');

                if (videoUrl) {
                    servers.push({
                        server: `${language} - ${serverName}`,
                        link: videoUrl.startsWith('http') ? videoUrl : `https:${videoUrl}`
                    });
                }
            });
        });

        return servers;
    } catch (error) {
        console.error("Error en getMovieLinks:", error.message);
        return [];
    }
};

const getMovieDetails = async (idSlug) => {
    try {
        const url = `${BASE_URL}/${idSlug}`;
        console.log(`[Scraper] Obteniendo página: ${url}`);
        
        const html = await cloudscraper.get(url);
        const $ = cheerio.load(html);

        const title = $('h1').first().text().trim() || idSlug.split('/').pop().replace(/-/g, ' ');
        
        let synopsis = $('h2.subtitle').filter((i, el) => $(el).text().includes('Sinopsis')).next('p').text().trim();
        if (!synopsis) synopsis = "Sinopsis no disponible en este momento.";
        
        const genres = [];
        $('h2.subtitle').filter((i, el) => $(el).text().includes('Género')).next('p').find('a').each((i, el) => {
            genres.push($(el).text().trim());
        });

        const items = [];
        
        // Selector directo basado en el HTML que proporcionaste
        $('li.objects-item a').each((i, el) => {
            const link = $(el).attr('href');
            if (!link) return;

            // FILTRO DE SEGURIDAD: Si el link no tiene la palabra temporada o episodio, lo ignoramos
            if (!link.includes('temporada') && !link.includes('episodio')) return;

            // Extraemos el texto del <p>
            let itemName = $(el).find('p').text().replace(/\s+/g, ' ').trim();
            
            // Si por alguna razón falla, usamos el atributo alt
            if (!itemName) {
                itemName = $(el).find('img').attr('alt') || `Elemento ${i + 1}`;
                itemName = itemName.replace(/poster /i, '').trim(); 
            }

            const imgElement = $(el).find('img');
            const img = imgElement.attr('src') || imgElement.attr('data-src') || "";
            
            let finalImg = "https://win98icons.alexmeub.com/icons/png/active_movie-1.png";
            if (img && img.startsWith('http')) {
                finalImg = img;
            } else if (img) {
                finalImg = `https:${img}`;
            }

            // Limpiamos la URL
            let cleanId = link;
            if (cleanId.includes(BASE_URL)) {
                cleanId = cleanId.replace(BASE_URL, '');
            }
            cleanId = cleanId.split('/').filter(Boolean).join('/');

            // Evitamos duplicados
            if (!items.find(item => item.id === cleanId)) {
                items.push({
                    id: cleanId,
                    title: itemName,
                    img: finalImg
                });
            }
        });

        console.log(`[Scraper] Se extrajeron ${items.length} sub-archivos (Temporadas/Episodios)`);

        const isMovie = idSlug.includes('pelicula/');

        return {
            id: idSlug,
            title,
            synopsis,
            genres,
            items,
            isMovie
        };

    } catch (error) {
        console.error("Error CRÍTICO en getMovieDetails:", error.message);
        throw error;
    }
};

// Se exportan únicamente las 3 funciones necesarias
module.exports = { searchMoviesScraper, getMovieLinks, getMovieDetails };