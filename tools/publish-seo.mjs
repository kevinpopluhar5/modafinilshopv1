import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const getArg = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const configPath = resolve(project, getArg('--config') || 'seo/publish.example.json');
const output = resolve(project, getArg('--out') || 'release-public');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const reject = reason => { throw new Error(reason); };
if (!config.readyToPublish || !config.catalogReplacedAndChecked || !config.operatorAndPoliciesVerified) reject('Verejne vydanie je vypnute, kym nie je overeny novy sortiment, prevadzkovatel a pravne stranky.');
if (!config.baseUrl || !/^https:\/\/[^/?#]+(?:\/[^?#]*)?$/.test(config.baseUrl)) reject('Doplnte skutocnu verejnu HTTPS adresu v baseUrl.');
if (output === project || output.startsWith(project + '/assets') || output === resolve('/')) reject('Neplatny vystupny adresar.');
const base = new URL(config.baseUrl.endsWith('/') ? config.baseUrl : config.baseUrl + '/');
const relPages = (config.publicPages || []).map(String);
if (!relPages.includes('index.html') || !relPages.includes('ochrana-osobnych-udajov.html')) reject('Zoznam verejnych stranok musi obsahovat hlavnu stranku a ochranu udajov.');
if (!relPages.some(p => p.startsWith('products/') && p.endsWith('.html'))) reject('Musi byt zadany novy schvaleny sortiment.');
if (relPages.some(p => /\.\.|^\/|\\/.test(p))) reject('Zla cesta v publicPages.');
const oldSlugs = ['modaxl-200','modawake','modacare-200','modacare-300','armodacare-150','armodacare-250','modalert-200','waklert','modvigil-200','artvigil'];
if (relPages.some(p => oldSlugs.some(slug => p === `products/${slug}.html`))) reject('V zozname verejnych stranok su stale povodne lieky na predpis.');
for (const path of relPages) if (!existsSync(resolve(project,path))) reject(`Chyba schvalena stranka: ${path}`);
const oldNames = /\b(?:MODAXL|MODAWAKE|MODACARE|ARMODACARE|MODALERT|WAKLERT|MODVIGIL|ARTVIGIL)\b/i;
for (const path of relPages) if (oldNames.test(readFileSync(resolve(project,path),'utf8'))) reject(`Stranka este obsahuje povodny sortiment: ${path}`);
for (const file of ['assets/cart.js','assets/checkout-wizard.js','assets/pricing-sk.js','assets/pricing-ui.js']) {
  if (existsSync(resolve(project,file)) && oldNames.test(readFileSync(resolve(project,file),'utf8'))) reject(`Logika obchodu este obsahuje povodne produkty: ${file}`);
}

const approved = config.approvedProducts || {};
const productFiles = relPages.filter(p => p.startsWith('products/'));
if (productFiles.some(p => !approved[p])) reject('Pre kazdy schvaleny produkt treba zadat overene metadata.');
for (const path of productFiles) {
  const v = approved[path];
  if (!v || !v.name || !v.description || !v.image || !Number.isInteger(v.priceCents) || v.priceCents < 1 || v.currency !== 'EUR' || !['InStock','OutOfStock','PreOrder'].includes(v.availability)) reject(`Neplatne alebo nekompletne produktove udaje pre: ${path}`);
  if (!existsSync(resolve(project,v.image))) reject(`Chyba fotografia: ${v.image}`);
}
if (existsSync(output) && readdirSync(output).length) reject('Vystupny adresar nie je prazdny; pouzite novy adresar, aby sa nepremiesali stare stranky.');
mkdirSync(output,{recursive:true});
cpSync(join(project,'assets'),join(output,'assets'),{recursive:true});
for (const misc of ['site.webmanifest','.htaccess']) if (existsSync(join(project,misc))) cpSync(join(project,misc),join(output,misc));
const tag = (key,value) => `<meta ${key} content="${String(value).replaceAll('&','&amp;').replaceAll('"','&quot;')}">`;
const script = obj => `<script type="application/ld+json">${JSON.stringify(obj).replaceAll('<','\\u003c')}</script>`;
const strip = text => text.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const absolute = path => new URL(path === 'index.html' ? '' : path,base).href;
for (const path of relPages) {
  let html = readFileSync(join(project,path),'utf8');
  const title = strip((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'');
  const description = (html.match(/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["']/i)||[])[1]||title;
  const url = absolute(path);
  const prod=approved[path];
  const imageUrl=new URL(prod?.image || 'assets/images/social-preview.webp',base).href;
  html=html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi,'');
  html=html.replace(/<meta\b[^>]*(?:property|name)=["'](?:og:|twitter:)[^>]*>/gi,'');
  let meta = `<link rel="canonical" href="${url}">\n`;
  for (const item of [['property="og:type"',prod?'product':'website'],['property="og:title"',title],['property="og:description"',description],['property="og:site_name"','ModafinilShop'],['property="og:locale"','sk_SK'],['property="og:url"',url],['property="og:image"',imageUrl],['name="twitter:card"','summary_large_image'],['name="twitter:title"',title],['name="twitter:description"',description],['name="twitter:image"',imageUrl]]) meta+=tag(...item)+'\n';
  const graph=[];
  if (path==='index.html') graph.push({'@context':'https://schema.org','@type':'WebSite',name:'ModafinilShop',url:base.href,inLanguage:'sk-SK'});
  if (prod) {
    graph.push({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Domov',item:base.href},{'@type':'ListItem',position:2,name:prod.name,item:url}]});
    graph.push({'@context':'https://schema.org','@type':'Product',name:prod.name,description:prod.description,image:[imageUrl],offers:{'@type':'Offer',url,priceCurrency:prod.currency,price:(prod.priceCents/100).toFixed(2),availability:`https://schema.org/${prod.availability}`}});
  }
  html=html.replace('</head>',meta+graph.map(script).join('\n')+'\n</head>');
  const target=resolve(output,path);
  mkdirSync(dirname(target),{recursive:true});
  writeFileSync(target,html,'utf8');
}
if (existsSync(join(project,'checkout.html'))) cpSync(join(project,'checkout.html'),join(output,'checkout.html'));
const xmlEscape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${relPages.filter(p=>p!=='checkout.html').map(p=>`  <url><loc>${xmlEscape(absolute(p))}</loc></url>`).join('\n')}\n</urlset>\n`;
writeFileSync(join(output,'sitemap.xml'),xml);
writeFileSync(join(output,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml',base).href}\n`);
console.log(`Verejna sada vygenerovana: ${output} (${relPages.length} stranok)`);
