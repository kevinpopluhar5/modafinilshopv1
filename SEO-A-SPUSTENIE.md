# ModafinilShop – SEO a kontrola pred spustením

## Stav tejto verzie

Tento archív je súkromné demo. Neobsahuje aktivovaný verejný SEO release ani dokončený e-shop. Pôvodné produktové stránky predstavujú lieky na predpis, preto nie sú určené na verejný internetový predaj. Produkty, fotografie a produktové texty zostali nezmenené. Frontend checkout ukazuje len simuláciu; neposiela reálnu objednávku.

Dokončené prípravy: prehliadačový obrázok pre sociálne siete `assets/images/social-preview.webp` (1200 × 630), zlepšené načítanie hero obrázka, doplnené deklarované rozmery obrázkov, prístupná klávesnicová skratka **Prejsť na obsah**, auditovací skript a generátor verejných SEO súborov.

## Pred ostrým nasadením – nutné

1. Overiť legálnosť a bezpečnosť celého **nového** sortimentu; odstrániť staré položky, odkazy, súbory a liekové tvrdenia. Súčasné položky sa nesmú použiť na verejný internetový predaj.
2. Doplniť reálneho prevádzkovateľa, kontakty, obchodné podmienky, podmienky vrátenia a reklamácií, právne správnu ochranu osobných údajov, cookies a fakturačné údaje. Text o ochrane údajov bez identity prevádzkovateľa nie je kompletný.
3. Nastaviť oficiálnu finálnu doménu HTTPS; tá v zadaní nie je, preto zatiaľ nie sú vložené žiadne fiktívne canonical adresy.
4. Až po schválení sortimentu doplniť `seo/publish.example.json` do vlastného súboru `seo/publish.json`. Nastaviť reálnu `baseUrl`, všetky publikovateľné HTML cesty a overené `approvedProducts` (názov, opis, cesta obrázka, cena v centoch, EUR, dostupnosť), potom nastaviť tri potvrdenia na `true`.
5. Vytvoriť produkčný výstup príkazom `node tools/publish-seo.mjs --config seo/publish.json --out release-v1`. Nástroj vytvorí canonical, sitemap, `robots.txt` s odkazom na sitemap, Open Graph/Twitter metadáta a pravdivé `WebSite`, `BreadcrumbList`, `Product`/`Offer` JSON-LD iba pre schválené položky. Výstup ide do **nového** adresára, nikdy neprepíše pracovný projekt.
6. Otestovať `sitemap.xml`, canonical adresy, Open Graph obrázky a produktové štruktúrované dáta v Google Rich Results Test / Search Console. Indexovanie začať až na skutočnej doméne, nie na demo odkaze.
7. Preveriť ceny aj zľavy serverom, skladové zásoby, Packeta picker a príjem zásielok, Chameleoon, SuperFaktúru, SMTP, GDPR, bezpečnosť servera a skutočné potvrdenia objednávok. Pred spustením treba prejsť reálny nákup s testovacími dátami a predajcom.
8. Nastaviť GA4 a Search Console; meranie konverzií a marketingové súbory spustiť až s právne správnym súhlasom a použitím.
9. Overiť Core Web Vitals (LCP, INP a CLS) a prístupnosť v iPhone Safari, Android Chrome a desktope. Testovať aj pomalé pripojenie, zmenu balenia, vymazanie košíka, Z-BOX, dobierku a výpadok servera.
10. CZ, PL, HU, AT, DE a RO pripraviť ako samostatné skutočne lokalizované verzie. `hreflang` a jazykové canonical sa nesmú aktivovať, kým tieto stránky neexistujú.

## Súkromné testovanie

Demo sa odporúča prevádzkovať za prihlasovaním / HTTP Basic Auth, nie ako verejne prehľadateľný e-shop. `robots.txt` nie je zabezpečenie proti indexácii. Nemeníme `noindex` direktívy, ale skutočnú súkromnosť zabezpečí iba kontrola prístupu.

## Lokálna kontrola

`python tools/audit-site.py`

`node --test server/tests/*.test.mjs`

`node --test tests/*.test.cjs`

## Čo sa zámerne neaktivovalo

- Verejná sitemap ani canonical na doménu, ktorú nepoznáme.
- `Product`/`Offer` údaje pre pôvodné lieky na predpis.
- Verejné registrácie obchodníka, fakturácia, zasielanie e-mailov alebo objednávok.
- Fiktívne recenzie, skladové zásoby, adresa prevádzkovateľa alebo dostupnosť.
