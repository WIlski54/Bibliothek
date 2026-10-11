# Die große Bibliothek: Entwicklerhandbuch (für Räume, Porträts, Katze)

Begehbare 3D-Bibliothek im Browser (Three.js, eine einzige HTML-Datei, kein Netzwerk außer beim Öffnen eines Popup-Buchs).
Zielgruppe: Klasse 5/6, Sprache Deutsch, Ansprache „Du“. Fachlich sauber (der Betreiber ist Chemielehrer): lieber weglassen als falsch.
Alles wird im Code gezeichnet (Canvas, Geometrie). Keine Fotos, keine Bilddateien, keine Schriften aus dem Netz (nur Georgia/system-ui).

## Aufbau

```
src/main.js            Einstieg, Eingabe, Schleife            (nicht ändern)
src/world/world.js     Räume zusammenbauen, Lichter, Picking  (nicht ändern)
src/world/nav.js       Kamerafahrt, Stationen, Routen         (nicht ändern)
src/world/layout.js    Grundriss, Maße, Abteilungsfarben      (nicht ändern)
src/world/kit.js       Baukasten (Wände, Regale, Möbel ...)   (nur Fehler beheben, sonst eigene Dateien)
src/world/tex.js       Prozedurale Texturen                   (dito)
src/world/books.js     Gestaltete Bücher (Deckel/Rücken)      (dito)
src/world/merge.js     Statische Geometrie zusammenfassen
src/world/rooms/dept.js  Gemeinsamer Fachraum-Bauplan: buildDept(ctx, id, style, extras)
src/world/rooms/foyer.js, geschichte.js, biologie.js, chemie.js   je Raum eine Datei
src/world/portraits.js   personFrame(id) -> Rahmen mit Porträt    (Besitzer: Porträt-Auftrag)
src/world/cat.js         Archimedes                               (Besitzer: Katzen-Auftrag)
src/data/persons.js      Personen-Daten
src/data/books.json      Bücherliste (Abteilung, Farbe, Adresse ...)
src/ui/ui.js, style.css, index.template.html   Oberfläche
src/lib, src/art       Papierschnitt-Technik aus den Popup-Büchern (dsl.js, paint.js, papercut.js, figure.js, util.js)
tools/                 Test- und Screenshot-Skripte
```

**Eigene Dateien:** Jeder Auftrag besitzt nur die oben genannten Dateien plus eigene neue Dateien (z. B. `src/world/ex/geschichte/*.js`, `src/data/elements.js`).
Fremde Dateien nicht umbauen. Findest Du einen Fehler in `kit.js`/`tex.js`/`books.js`/`dept.js`, behebe ihn minimal (kleiner Diff, kein Umformatieren) und nenne es im Abschlussbericht.
Brauchst Du eine neue Hilfsfunktion, lege sie in Deine eigene Datei.

## Koordinaten und Raumvertrag

- Meter, y nach oben, Boden y = 0. Jeder Raum wird in **lokalen Koordinaten (Mitte 0,0)** gebaut; `world.js` setzt ihn an `ROOMS[id].offset`.
- Wände: N = −z, S = +z, E = +x, W = −x. Wandkoordinate `a` läuft von innen gesehen **links → rechts**.
  `wallPos(room, wall, a, off)` → `{x, z, ry}`; `placeWall(obj, room, wall, a, off, y)` stellt ein Objekt an die Wand, die Vorderseite (+z des Objekts) schaut in den Raum.
- Raummaße: Geschichte 12×10×4.8 (Tür an Wand E), Biologie 10×12×5.2 (Tür an S), Chemie 12×10×4.8 (Tür an W). Foyer 14×12×6.4. Rundbogentür 2.4×3.3 mittig an der Türwand. `layout.js`.
- Augenhöhe der Kamera 1.6 m. Alles Wichtige zum Antippen sollte zwischen 0.6 und 2.2 m hängen/stehen.
- Ein Fachraum-Modul exportiert `build(ctx)` und gibt zurück: `{ group, stations, lights, blockers, update?(dt, t) }`.
  Der einfachste Weg: `return buildDept(ctx, 'geschichte', style, (api) => { ...Exponate...; return { update } })`.
  `api` hat: `id, R (Raummaße), room ({w,d}), doorWall, far (Wand gegenüber der Tür), sides, st (Stil), g (Gruppe), stations, lights, units (Regaleinheiten), place(obj, wall, a, off, y), removeUnit(u)`.
  `style` überschreibt: `wall, floor, ceiling, trim, wainscot, floorTile, wallTile, palette (Farben der Füllbücher), carpet, lightColor, shelfWood, shelfBack, tall, tableWood, plants`.
  Regaleinheiten dürfen entfernt (`api.removeUnit(u)`) oder verschoben werden, um Platz für Wandbilder/Vitrinen zu schaffen; Lücken im Bücherbestand: `u.userData.taken[slotIndex].push([x0, x1])`.
  Die Füllbücher werden nach `extras()` ergänzt.
- **Stationen** (Kamera-Standpunkte): `{ id, room, name, pos:[x,y,z], look:[x,y,z], hidden?, catSpot?:[x,y,z] }` in lokalen Koordinaten. `buildDept` liefert `<id>-eingang`, `<id>-tuer` und `<id>-regal-<Wand>`. Füge für Deine Exponate eigene Stationen hinzu (`<id>-<name>`, deutscher `name` für die Leiste unten, z. B. „Geschichte: Schaukästen“). Reihenfolge = Reihenfolge der Pfeile ‹ ›. 4 bis 8 Stationen je Raum sind gut. Jede Station soll von dort aus ein schönes Bild geben, Kamera 1.6 m hoch, Blick leicht abwärts auf Exponate ist erlaubt.
- **Lichter:** höchstens 4 echte PointLights je Raum (Liste `lights`: `{pos, color, intensity, distance:0, decay:2}`, `buildDept` legt 2 an; Du kannst `api.lights` ändern, max. 4). Keine eigenen `THREE.Light` in die Szene stellen. Leuchtende Dinge (Lampen, Flammen, Bildschirme) über `emissive`-Materialien. Kein Schatten-Rendering.
- Es gibt `scene.environment` (RoomEnvironment) für glänzende Materialien (Messing, Glas).

## Antippen (Hotspots)

Jedes Objekt mit `userData.tap` ist anklickbar (das nächstgelegene Elternobjekt mit `tap` gewinnt). Raumwände verdecken Dahinterliegendes.
```
{ kind: 'info', title, sub, paras: [..], fact: '..', factLabel?: 'Wusstest du? ', image?: canvas|dataURL, wide?: bool, alt?, tag?: 'Geschichte', dept?: 'geschichte', links?: [{label,url}], actions?: [{label, fn}], src?: 'Hinweis zur Unsicherheit/Quelle', station?: 'id', label?: 'Tooltip' }
{ kind: 'book', book: <Eintrag aus ctx.books>, station? }
{ kind: 'goto', station }            { kind: 'nav', to: 'foyer'|'geschichte'|... }
{ kind: 'say', text, who? }          Sprechblase
```
- `station`: Ist angegeben und die Kamera steht nicht dort, fährt sie erst hin und öffnet danach die Karte.
- Für Tippflächen ohne sichtbares Objekt: `hitPlane(w,h,tap)`, `hitBox(w,h,d,tap)` aus `kit.js` (unsichtbar, aber anklickbar). Ein Regal als Ganzes wird über eine unsichtbare Fläche an der Rückwand angetippt (siehe `dept.js`), damit die Regalgeometrie zusammengefasst werden kann.
- Karten sind für Kinder: kurze Absätze (max. 2 bis 3 Sätze), ein „Wusstest du?“-Fakt, Unsicheres ehrlich kennzeichnen (`src`).

## Zusammenfassen (merge.js) und Leistung

`world.js` fasst nach dem Bauen alle **statischen** Meshes eines Raums nach Material zusammen. Ausgenommen: alles unter einem Objekt mit `userData.tap`, `userData.dynamic = true` (animiert!) oder `userData.keep = true`, transparente Materialien, Material-Arrays.
→ Animierte Teile (Drehendes, Flackerndes) in eine Gruppe mit `userData.dynamic = true` legen, sonst werden sie festgeklebt.
→ Gleiche Materialien wiederverwenden (`M.wood(...)`, `M.plain(...)` sind gecacht; eigene Materialien nur einmal erzeugen und teilen).
Budget je Station (gemessen mit `node tools/stats.mjs <station>`): **Zeichenaufrufe ≤ 250, Dreiecke ≤ 350 000** (Raum + Blick durch die Tür), Texturen je Raum ≤ 24 MPixel zusammen (Canvas-Texturen ≤ 1024×1024, meist 512), keine Textur größer als 2048. Zielgerät: iPad (Safari), 1.5-fache Pixeldichte.
Teure Geometrie sparsam: Kugeln 24×16 Segmente genügen, keine 1000-Dreieck-Dinge für Kleinkram. Texturen im Code erzeugen und cachen, nicht pro Frame neu zeichnen.

## Stil

Warm, gemütlich, „Bibliothek mit Charme“, Papierschnitt-Akzente (Schichten mit weichem Schatten). Eigene Farbwelt je Raum (siehe `DEPT_COLORS` in layout.js). Bildqualität wie die vorhandenen Foyer-/Raum-Screenshots: nichts Flaches, kein leeres Rechteck: Wände brauchen Bilder/Regale/Leisten, Böden Teppiche, Ecken Pflanzen oder Möbel.
Exponate sollen **erkennbar** sein (Silhouette!) und so groß, dass man sie aus der Station gut sieht.

## Bauen, Testen, Screenshots

```
cd <dein Worktree>; npm install                                  # einmalig (node_modules ist ignoriert, nie committen)
node build.mjs --dev --out=$SCRATCH/lib.html                     # Bündel bauen (ca. 3 s)
export BOOK_HTML=$SCRATCH/lib.html OUT_DIR=$SCRATCH/shots        # SCRATCH = ein eigener Ordner in /tmp
node tools/shots.mjs <station> [<station> ...]                   # PNGs (1024x640) je Station nach $OUT_DIR/<station>.png ; LOOK=yaw,pitch (rad) dreht, W/H/Q setzen Größe/Qualität
node tools/stats.mjs [<station> ...]                             # Zeichenaufrufe/Dreiecke/Texturen
node tools/test-nav.mjs ; node tools/test-tap.mjs                # Fahrt- und Tipp-Tests (müssen grün bleiben)
```
- Software-Rendering (SwiftShader) ist langsam: pro Bild 5 bis 20 s, keine Dauerschleifen mit vielen Renderaufrufen. `?manual=1` hält die Hauptschleife an, `window.__lib.step(dt, n)` rechnet n Schritte und zeichnet einmal. `window.__lib` = `{ rig, world, ui, THREE, renderer, scene, camera, goStation, goRoom, handleTap, ctx }`.
- **Schau Dir jedes Bild wirklich an** (Read-Tool auf die PNG) und verbessere, bis es gut aussieht. Prüfe Antippen: Raycast auf ein Objekt (siehe tools/test-tap.mjs: Weltposition → Bildschirm → `page.mouse.click`) und dass die Karte aufgeht.
- Beim Jump per `shots.mjs` ist die Kopfzeile oben links nicht aktualisiert (Testartefakt).
- Konsolenfehler/-warnungen müssen null sein (außer „permissions policy“-Hinweisen des Browsers).

## Inhalte und Fakten

- Alle Texte Deutsch, kurz, kindgerecht, ohne Schulbuch-Ton. Zahlen und Namen sauber; bei Unsicherem (Datierungen, Zuschreibungen) einen ehrlichen Hinweis im Feld `src`/`uncertain`. Kein Eintrag, den Du nicht mit gutem Gewissen vertreten kannst.
- Namen echter Personen nur sachlich. Porträts sind stilisierte Zeichnungen, keine Fotos und keine Nachbildung bekannter Fotos.
- Der Betreiber ist Chemielehrer: Fachliches in Chemie/Biologie muss stimmen (Symbole, Ordnungszahlen, Namen, Formeln).

## Git

Arbeite im zugewiesenen Worktree auf Deinem Branch. Häufig committen, Nachricht auf Deutsch, am Ende:
```
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YCGN1AuzeMnckiFhEuVvoS
```
Nicht pushen (es gibt noch kein Remote). `node_modules` nie committen oder verlinken. Am Ende: kurzer Bericht (was gebaut, Stationen, Messwerte, bekannte Mängel, Fehler in fremden Dateien).
