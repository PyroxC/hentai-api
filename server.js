import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 তোমার TMDB API Key বসাও
const TMDB_KEY = process.env.TMDB_KEY;
const BASE_URL = "https://hentaiplanet.info/";

// Scraper Function
async function scrapeFiles() {
  const res = await fetch(BASE_URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  let files = [];
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href && href.endsWith(".mp4")) {
      files.push({
        name: href.replace(/\.mp4$/, ""),
        url: BASE_URL + href,
      });
    }
  });
  return files;
}

// Route
app.get("/api/tmdb/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // TMDB Fetch
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=en-US`
    );
    const tmdbData = await tmdbRes.json();

    if (tmdbData.success === false) {
      return res.status(404).json({ error: "TMDB not found" });
    }

    const title =
      tmdbData.title || tmdbData.name || tmdbData.original_title || "";

    // Scrape hentaiplanet
    const files = await scrapeFiles();

    // Match title (simple match)
    const matched = files.filter((f) =>
      f.name.toLowerCase().includes(title.toLowerCase().split(" ")[0])
    );

    res.json({
      tmdb_id: id,
      title,
      release_date: tmdbData.release_date,
      overview: tmdbData.overview,
      poster: `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`,
      matches: matched,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Vercel require
export default app;
