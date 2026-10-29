# SK cenová simulácia — súkromné testovanie

Jednotková cena je za 10 tabliet (1 balenie). Ceny SK produktu a dopravy sú v `assets/pricing-sk.js` a zobrazujú sa v katalógu, košíku aj zhrnutí. Ostatné krajiny nemajú priradené ceny.

| Balenia | Tabletky | Zľava |
|---:|---:|---:|
| 1 | 10 | 0 % |
| 2 | 20 | 5 % |
| 3 | 30 | 10 % |
| 5 | 50 | 15 % |
| 10 | 100 | 20 % |

Na výber je iba **10, 20, 30, 50 a 100 tabletiek**. Zľava sa počíta **za jednotlivý produkt podľa počtu 10-tabletových balení**. Celkové množstvo v košíku a zhrnutí je uvedené v tabletkách. Zaokrúhľovanie sa vykonáva v centoch na úrovni položky. Doprava: SK Packeta adresa 3,90 €, Packeta Z-BOX/výdajné miesto 3,90 €. Platba: dobierka.

**Iba súkromné demo.** V starom katalógu sú lieky na predpis. Objednávkový formulár neodosiela objednávky, faktúry ani zásielky; backendová brána pre povolenie zostáva nesplnená. Pred verejným nasadením je potrebný nový predajný sortiment, právne posúdenie, oficiálny cenník a reálne testy integrácií.
