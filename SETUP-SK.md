# ModafinilShop v41 – integračný základ

## Čo je pripravené

- Celý vizuálny web z v40, všetkých desať existujúcich detailov, galérie, CSS, JS a obrázky.
- Checkout s jedinou platbou **dobierka** a voľbou Packeta na adresu / výdajné miesto.
- Pripojovací kód oficiálneho widgetu Packety v6. Kým nie je nastavený **verejný widget API kľúč**, výber cez mapu sa nezobrazí a ostáva pôvodné prezentačné ovládanie.
- Samostatný Node.js backend bez aktívnych externých operácií, serverové validácie, ochrana proti opakovanému zápisu objednávky (`Idempotency-Key`), prísne kontrolované sumy a PostgreSQL schéma.
- API pre Chameleoon podľa definície „Externý systém“ (objednávky podľa dátumu, objednávka podľa ID, aktualizácia stavu a čísla zásielky). Prístup chránený bearer tokenom. Aktivácia až po skončení príprav.
- SuperFaktúra: kontrolný dátový návrh faktúry a generátor SFAPI autorizácie. **Vytváranie faktúr v SuperFaktúre zatiaľ nie je zapnuté ani hotové**. Pred aktiváciou treba validovať účtovné parametre v sandboxe.
- Pripravené HTML šablóny e-mailov zákazníkovi a prevádzke, bez aktívneho SMTP odosielania.
- Pripravené API na kontrolu objednávok administrátorom chránené bearer tokenom. Nie je hotový administračný panel s prihlásením.
- SQL tabuľka pomocných udalostí `shop_outbox`, aby bolo možné neskôr pripraviť spoľahlivé opakované doručovanie notifikácií a faktúr. Pracovník na spracovanie udalostí ešte nie je hotový.
- Testy logiky cien, dobierky, odberného miesta, mapovania pre Chameleoon a bezpečnostného vypnutia objednávok.

## Spustenie súkromného testovania

1. Potrebné: Node.js 20+, terminál. V adresári `server` spustite `node src/server.mjs`.
2. Otvorte `http://127.0.0.1:3000/` a `http://127.0.0.1:3000/checkout.html`.
3. `GET /api/health` vracia stav. `GET /api/config` vracia režim a informáciu, či sú objednávky vypnuté.
4. `node --test tests/*.test.mjs` overí pripravené výpočty. Pri štandardnom demo režime netreba inštalovať balíky.
5. Ak sa stránka nahrá len na GitHub Pages, beží **iba statické demo**. Serverové API nie je na GitHub Pages dostupné.

## Čo doplníme až po výmene produktov

1. Vymeniť všetky súčasné produkty, fotografie, texty a názvy za legálne predajné produkty. Súčasné lieky na predpis nie sú pripravené na online predaj.
2. Založiť súkromný cenník produktov vo formáte `server/settings/catalog.example.json`: napr. `[ {"sku":"vasa-polozka","name":"Výrobok","priceCents":1299,"active":true,"image":"assets/images/vas-obrazok.webp"} ]`. Použiť **skutočné** ceny v centoch, nie dočasné sumy.
3. Ceny dopravy v centoch vo formáte `{ "homeCents": 499, "pickupCents": 349, "currency":"EUR" }` sú **len príklad formátu**, nie odporúčané ceny. Zapísať vaše skutočné ceny.
4. Upraviť frontend katalógu, výpočty a ceny tak, aby používali rovnaký serverový cenník. Aktuálne staré ukážkové sumy sú stále uložené vo frontende z predchádzajúcich verzií a preto ich neslobodno používať ako finálne ceny.
5. Pripojiť PostgreSQL a spustiť `server/sql/001_orders.sql`. Do skutočného prostredia neukladať `.env` do verejného adresára. Použiť HTTPS a pravidelné zálohy.
6. Získať schválený účet Packeta a **widget API kľúč**. Ten môže byť dostupný v prehliadači; API heslo Packety do prehliadača nikdy nepatrí.
7. V Chameleoone zvoliť **Externý systém**, nastaviť URL našich `/api/chameleoon/*` endpointov a bearer token. Zmapovať dopravcu `packeta` a platbu `dobierka` v aplikácii. Zásielky vytvára Chameleoon: nepúšťať súbežne aj samostatné automatické vytváranie zásielok cez Packetu.
8. Získať **SuperFaktúra API e-mail, API kľúč a company ID**. Najprv vytvoriť testovací doklad v oficiálnom sandboxe, overiť správnu DPH, firmu, dátum, platbu dobierkou, položky a spôsob párovania. Automatická tvorba faktúr ešte vyžaduje samostatnú finálnu implementáciu a testy.
9. E-mail zákazníkovi a prevádzke (SMTP, doručiteľnosť SPF/DKIM/DMARC), admin rozhranie, evidencia objednávok, export, zálohy a politiky uchovávania údajov ešte nie sú hotové.
10. Skontrolovať obchodné podmienky, ochranu osobných údajov, cookies, reklamácie, dopravné podmienky, daňové parametre a oprávnenie na predaj príslušného sortimentu. Ostrý predaj spustiť až po právnej a technickej kontrole.

## Aktivácia backendu po schválení

Vytvorte súbor `server/.env` podľa `.env.example` (tajné údaje nezverejňujte) a nastavte reálne cesty `CATALOG_PATH`, `SHIPPING_PATH`, `DATABASE_URL`, `PUBLIC_ORIGIN`. Backend je bezpečnostne vypnutý, pokým **všetky** tieto príznaky nie sú pravdivé:

- `APP_MODE=live`
- `ORDERS_ENABLED=true`
- `LEGAL_PRODUCTS_APPROVED=true`
- `BUSINESS_APPROVED=true`
- `TERMS_APPROVED=true`
- `PRICES_VERIFIED=true`
- `SHIPPING_PRICES_VERIFIED=true`
- skutočný platný katalóg, skutočný cenník dopravy a dostupné DB spojenie

Samotné prepnutie nie je dokončenie predajného webu; pred aktiváciou je potrebná komplexná testovacia séria s novým sortimentom.

## Zdroje technických integračných rozhraní

- Packeta Widget v6: https://docs.packeta.com/docs/pudo-delivery/widget
- Packeta Widget v6 knižnica: https://widget.packeta.com/v6/www/js/library.js
- Chameleoon externý systém: https://docs.chameleoon.sk/external-system
- Chameleoon schéma API: https://docs.chameleoon.sk/api-v3
- SuperFaktúra dokumentácia REST: https://github.com/superfaktura/docs

## Dôležité prevádzkové obmedzenia

- Nesmú sa odosielať skutočné objednávky, faktúry alebo zásielky pre súčasné produkty na predpis.
- Žiadny reálny SuperFaktúra účet, Packeta účet ani Chameleoon účet sa v tejto fáze nepoužil; nemáme prístupové údaje.
- Netestovalo sa na ostrých systémoch poskytovateľov. Otestované sú len lokálne výpočty a API ochranné mechanizmy.

Pozor: niektoré Packeta Z‑BOXy môžu mať obmedzenie dobierky. Pred ostrým spustením treba vybrané miesta overiť podľa Packeta dát a vyskúšať reálne možnosti dobierky.
