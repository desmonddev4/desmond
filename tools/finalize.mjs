#!/usr/bin/env node
/* Run once before you deploy:   node tools/finalize.mjs https://your-domain.com
   Writes the absolute-URL bits that cannot be known until you have a domain:
   canonical + og:url + og:image on public pages, sitemap.xml and robots.txt. Safe to re-run. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (process.argv[2] || '').trim().replace(/\/+$/, '');
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(:\d+)?$/i.test(arg)) {
  console.error('Usage: node tools/finalize.mjs https://your-domain.com   (https, no path)');
  process.exit(1);
}
const pages = { index: '', about: 'about.html', work: 'work.html', services: 'services.html', contact: 'contact.html', cv: 'cv.html' };
const strip = s => s.replace(/\n?<link rel="canonical"[^>]*>/g, '').replace(/\n?<meta property="og:url"[^>]*>/g, '');
for (const [name, path] of Object.entries(pages)) {
  const f = join(root, name + '.html');
  let s = strip(readFileSync(f, 'utf8'));
  const url = `${arg}/${path}`;
  s = s.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${arg}/assets/og.jpg">`);
  s = s.replace('<meta property="og:type"', `<link rel="canonical" href="${url}">\n<meta property="og:url" content="${url}">\n<meta property="og:type"`);
  writeFileSync(f, s);
}
const list = ['index.html', 'about.html', 'work.html', 'services.html', 'contact.html', 'cv.html'];
const day = new Date().toISOString().slice(0, 10);
writeFileSync(join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  list.map(p => `  <url><loc>${arg}/${p === 'index.html' ? '' : p}</loc><lastmod>${day}</lastmod></url>`).join('\n') + `\n</urlset>\n`);
writeFileSync(join(root, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /inbox.html\n\nSitemap: ${arg}/sitemap.xml\n`);
console.log('Done for ' + arg);
