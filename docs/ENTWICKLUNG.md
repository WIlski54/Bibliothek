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
- `resolve(hit)`: Statt fester Karte kann `tap = { resolve: (hit) => <tap-Objekt oder null>, label? }` gesetzt werden. `hit` = `{ point (Welt), uv, obj, hit }`. Damit lässt sich z. B. auf einer Tafel (Periodensystem) das angetippte Feld bestimmen.
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

## Nachträge (Stand nach Integration der Räume)

- **Weltkarte:** `src/world/ex/worldmap.js` zeichnet eine echte Karte aus Natural-Earth-Daten (gemeinfrei, `src/data/world-50m.json`): `drawWorld(g, w, h, {proj:'robinson'|'equirect', style:'atlas'|'parchment', ...})`, `worldProject(...)` für Markierungen, `globeTexture()` für Globen (gecacht, geteilt). `kit.globe({map})` hat eine geneigte Erdachse; `g.userData.sphere.rotation.y` ist die Drehung.
- **Buch-Auftritt:** `src/world/showcase.js`. Antippen eines fertigen Buchs lässt es aus dem Regal auf einen kleinen Lesetisch fliegen, die Kamera fährt heran (`rig.flyTo`), unten erscheint die Leiste „Lesen / Zurück ins Regal“, „Lesen“ blendet das Buch (iframe) sanft ein. Der Tisch steht standardmäßig 2 m vor der Kamera; Stationen können mit `bookSpot: [x, z]` (lokal) einen Platz vorgeben (wichtig, wenn die Station nah an einer Wand oder Vitrine steht).
- **Archimedes (Verhalten):** `src/world/cat.js` + `src/world/ex/cat/`. Platz je Station: `catSpot: [x, y, z]` (lokal, y = Höhe der Fläche) wird nur übernommen, wenn die Katze dort im Bild sitzt und frei steht; sonst wählt `ex/cat/space.js` automatisch aus der echten Raumgeometrie (Belegungsraster aus allen sichtbaren Meshes). Neue Exponate müssen nichts tun.
- **Zusammenfassen:** `merge.js` lässt Objekte mit `visible === false` aus. Alles Animierte braucht `userData.dynamic = true`.
- **Ruhiger Modus:** `rig.calm` → Überblenden statt Kamerafahrt (`#fade`), keine drehenden/laufenden Animationen außer Atmen und Blinzeln.
- **Tests:** `tools/test-*.mjs` (tap, showcase, nav, layout, portraits, cat, chemie, geschichte, biologie). Unter hoher Rechnerlast kann ein Screenshot-Timeout auftreten (Software-Rendering); `harness.mjs` setzt 240 s.

## Archimedes in 3D (Blender)

Archimedes ist ein echtes, geskinntes 3D-Modell: `assets/cat/archimedes.glb` (eingebettet, kein Netzwerk). Die Papierkatze bleibt als Rückfall im Code.

```
src/world/cat.js                 Fassade (createCat): 3D-Katze, Rückfall auf Papier (?cat=paper oder Ladefehler; ?cat=fail simuliert einen Ladefehler)
src/world/ex/cat/cat3d.js        Archimedes3D (erbt Verhalten/Wegsuche/Texte von Archimedes in archimedes.js, ersetzt nur die Figur)
src/world/ex/cat/archimedes.js   Verhalten (Zustände, Wege, Tipps) + Papierfigur (Rückfall)
assets/cat/archimedes.glb        Modell, 14 Clips + sit_calm (erzeugt, nicht von Hand ändern)
assets/cat/portrait.jpg          Render für das Gemälde im Foyer (eingebettet als Data-URL, 720 x 960)
tools/blender/archimedes.py      Hauptskript, dazu catshape/catmesh/sdfmesh (Form), cattex (Fellfarbe), catparts (Augen, Lider, Halsband, Marke, Schnurrhaare),
                                 catrig (Skelett, Gewichte), catplanar/catgait/catanim (Clips), portrait/preview (Bilder)
```

**Neu bauen** (Blender als Python-Modul, keine Oberfläche, ca. 15 s; Zwischenstände in `tools/blender/.cache`, nicht im Git):
```
/home/user/blenv/bin/python tools/blender/archimedes.py                       # -> assets/cat/archimedes.glb
/home/user/blenv/bin/python tools/blender/archimedes.py --no-export --render DIR   # Dreh- und Posenbögen (Cycles, CPU, ca. 70 s)
/home/user/blenv/bin/python tools/blender/archimedes.py --no-export --portrait assets/cat/portrait.jpg   # Gemälde (ca. 100 s)
```
Das Ergebnis ist deterministisch (gleiches Skript, gleiche Bytes). Danach `node build.mjs` und die Tests (unten).

**Modell:** Die Form steht als Distanzfeld (Ellipsoide, Rundkegel, Kugelketten; Maße in cm in `catshape.py`, Sitzpose = Bindepose, Blick nach −y). Sie besteht aus überlappenden Teilnetzen
(Körper, Kopf, Kiefer, 2 Ohren, 2 Vorderbeine, 2 Hinterbeine, Schwanz), jedes mit Surface Nets gemeshed und in Blender ausgedünnt: wie bei einem Plüschtier, deshalb ziehen Beine und Schwanz beim Laufen keine Haut.
Normalen und Umgebungsverdeckung kommen aus dem Feld, die Hautgewichte aus dem Abstand zu den Teilvolumina der Knochen (`catrig.skin_weights`, höchstens 4 je Punkt). Die Fellkarte (1024², JPEG) wird aus einer 3D-Funktion
(`cattex.py`: getigert, weiße Brust, Söckchen, Schnauze, Augenlinie, Ohr innen, Nase, Mundlinie) per Python in die UV-Karte gebacken, samt AO. Augen: Kugeln mit azimutaler Karte (Iris, Pupille, Glanzlichter), Lider als Halbkugelschalen an Lidknochen (Blinzeln, Schlafen, Schreck).
Zubehör (ein Netz, Atlas 64²): Halsband (rot), Messingmarke, 8 Schnurrhaare. 3 Materialien (Fell, Augen, Zubehör), 3 Netze.

**Zahlen:** 12 080 Dreiecke (Fell 10 672, Augen 648, Zubehör 760), 33 Knochen, GLB 1,15 MB (Fellkarte 165 KB, Animationen 280 KB), Fell-Textur 1024 x 1024.

**Skelett:** root, pelvis, spine1, spine2, neck, head, jaw, earL1/2, earR1/2, eyeL/R, lidL/R (Oberlid), tail1–6, je Bein (foreUp/foreLow/forePaw, thigh/shin/hindPaw) links (L, +x) und rechts (R).

**Clips** (30 fps, Namen exakt): `sit_idle` (Atmen, Schwanzspitze, Ohren, Schleife 3,2 s), `sit_calm` (nur Atmen, Ruhiger Modus), `blink`, `talk`, `meow`, `scared`, `groom`, `stretch`, `walk`, `trot`, `run`, `jump_up`, `jump_down`, `sleep_idle`, `wake`.
Laufzyklen auf der Stelle (ebene IK, Pfoten bleiben beim Aufsetzen am Boden); das Tempo steuert die Abspielrate (`gaits` in den Extras des GLB: Strecke je Zyklus). Jeder Clip führt alle Knochen (Mischen und Überblenden sind dadurch eindeutig), außer `blink`: er wird in `cat3d.js` auf Lider und Augen gekürzt und läuft in einem zweiten Mischpult.
Neue Posen: in `catanim.py` eine Funktion `clip_<name>(u)` schreiben (u = 0..1) und in `CLIPS` eintragen; Winkel in Grad um die Skelettachsen (x quer, y nach hinten, z oben), `ik_pose(...)` für Stehen/Springen mit am Boden bleibenden Pfoten.

**Verhalten → Clip** (`Archimedes3D.chooseClip`): sleep → `sleep_idle`, wake → `wake`, groom → `groom`, stretch → `stretch`, sit → `sit_idle` (Ruhiger Modus: `sit_calm`), Sprechen (`speakT`) → `talk`, Antippen → `meow` (zweimal schnell: `scared`),
Weg → `walk`/`trot`/`run` nach Tempo (mit Hysterese, Abspielrate = Tempo / Zyklusstrecke), Sprung auf/von Möbeln → `jump_up`/`jump_down` (Zeit = Fortschritt des Sprungs). Körper dreht sich in Laufrichtung bzw. weich zur Kamera, Kopf, Hals und Augen folgen dem Besucher (`lookAt`), außer im Ruhigen Modus, beim Schlafen und Putzen. Tippfläche: unsichtbare Box (`userData.tap` an der Gruppe), die Netze selbst sind nicht antippbar.
Material: Fell als `MeshPhysicalMaterial` mit schwachem Sheen (weicher Plüschrand), Augen leicht selbstleuchtend, Zubehör aus dem GLB (Messing mit Metall/Rauheit-Karte). Bodenschatten: weiche transparente Scheibe (`fx.js`).

**Leistung:** Zeichenaufrufe der Katze 3 Netze + Schatten (+ Zzz/Symbol, höchstens 8), Dreiecke 12 080. Bundle (minifiziert) wächst um etwa 1,6 MB (GLB als Base64 1,55 MB, GLTFLoader und Code etwa 95 KB).

**Werkzeuge und Tests:**
```
node tools/cat3d-sheet.mjs [clip ...]        Kontaktbogen der Clips aus Three.js (4 Zeitpunkte je Clip) -> $OUT_DIR/cat3d-sheet-<n>.png
node tools/cat3d-shots.mjs [station ...]     Screenshots der Katze in den Räumen (STATE=sit|sleep|groom|stretch|meow|talk|walk|trot|run, CLOSE=front|q3|side|back, DIST=, HEAD=1)
node tools/test-cat.mjs                      Verhalten, Sichtbarkeit, Antippen, Tipps, Ruhiger Modus, Zeichenaufrufe (<= 8), Dreiecke (<= 14 000); CAT=paper prüft die Papierkatze
node tools/test-cat-fallback.mjs             ?cat=paper und simulierter Ladefehler (?cat=fail)
```
