# Family Tree Generator

## Spuštění
1. Rozbal ZIP archiv.
2. Otevři složku `family-tree-generator-main`.
3. Otevři `index.html` v prohlížeči.

Není potřeba instalovat Node.js, server ani další knihovny.

## Soubory
- `index.html` – struktura stránky a ovládací prvky
- `style.css` – vzhled aplikace
- `script.js` – formulář, kontrola návaznosti předků, rozložení a generování SVG

## Funkce
- 4 generace včetně výchozí osoby (15 možných osob)
- jméno a příjmení + profese
- vertikální a horizontální orientace
- samostatný světlý a tmavý motiv generovaného rodokmenu
- rozlišení prarodičů a praprarodičů podle rodové větve
- nevyplnění členové se nevykreslují
- předek se vykreslí pouze tehdy, pokud jsou vyplnění všichni jeho potomci směrem k výchozí osobě
- export do SVG; zvolený motiv se zachová i v exportovaném souboru

## Poznámka
Google Fonts se načítají z internetu. Samotný generátor a jeho data fungují lokálně v prohlížeči.
