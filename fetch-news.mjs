// fetch-news.mjs
// Mengambil berita terbaru dari RSS feed sumber berita resmi,
// lalu menyimpannya sebagai data/news.json untuk ditampilkan di situs.
// Hanya menyimpan judul, ringkasan singkat, sumber, dan link asli
// (tidak menyalin isi artikel penuh) untuk menghormati hak cipta sumber.

import Parser from "rss-parser";
import { writeFile } from "fs/promises";

const parser = new Parser({ timeout: 15000 });

// Daftar sumber RSS publik, dikelompokkan per kategori.
// Bisa ditambah/kurangi sesuai kebutuhan.
const FEEDS = {
  nasional: [
    "https://www.antaranews.com/rss/terkini.xml",
  ],
  ekonomi: [
    "https://www.antaranews.com/rss/ekonomi.xml",
  ],
  olahraga: [
    "https://www.antaranews.com/rss/olahraga.xml",
  ],
  teknologi: [
    "https://www.antaranews.com/rss/tekno.xml",
  ],
  hiburan: [
    "https://www.antaranews.com/rss/hiburan.xml",
  ],
  dunia: [
    "https://www.antaranews.com/rss/dunia.xml",
  ],
};

function cleanSummary(text) {
  if (!text) return "";
  // Buang tag HTML kalau ada, potong jadi ringkas (bukan menyalin penuh)
  const plain = text.replace(/<[^>]+>/g, "").trim();
  return plain.length > 160 ? plain.slice(0, 160).trim() + "…" : plain;
}

async function fetchCategory(name, urls) {
  const items = [];
  for (const url of urls) {
    try {
      const feed = await parser.parseURL(url);
      for (const entry of feed.items.slice(0, 10)) {
        items.push({
          title: entry.title || "(tanpa judul)",
          link: entry.link,
          source: feed.title || "Sumber",
          summary: cleanSummary(entry.contentSnippet || entry.content),
          published: entry.isoDate || entry.pubDate || null,
        });
      }
    } catch (err) {
      console.error(`Gagal ambil feed ${url}:`, err.message);
    }
  }
  // Urutkan terbaru dulu
  items.sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0));
  return items;
}

async function main() {
  const result = {
    updatedAt: new Date().toISOString(),
    categories: {},
  };

  for (const [name, urls] of Object.entries(FEEDS)) {
    result.categories[name] = await fetchCategory(name, urls);
  }

  await writeFile("data/news.json", JSON.stringify(result, null, 2), "utf-8");
  console.log("Selesai. data/news.json diperbarui pada", result.updatedAt);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
