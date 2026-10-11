# Lizenzübersicht

| Teil | Lizenz | Datei |
|---|---|---|
| Quellcode (`src/`, `tools/`, `build.mjs`), im Code erzeugte Kunst (Räume, Möbel, Exponate, Porträts, Katze, Klänge) | MIT | `LICENSE` |
| Texte und Karten (`src/data/`, Kartentexte in `src/world/ex/`), `README.md`, `docs/` | CC BY-SA 4.0 | `LICENSE-CONTENT` |

Bitte bei Weitergabe nennen: **„Die große Bibliothek“ von Stephan Wilski**, https://github.com/WIlski54/Bibliothek

## Bestandteile von Dritten

- **three.js** (MIT), https://threejs.org – gebündelt in `dist/index.html`.
- **clipper-lib** (Boost Software License 1.0) – Papierschnitt-Konturen, gebündelt.
- **esbuild** (MIT), **playwright-core** (Apache 2.0) – nur zum Bauen und Testen.
- Die Papierschnitt-Technik stammt aus den „Großen Popup-Büchern“ (Dinosaurier, Ägypten) desselben Autors.
- Die Popup-Bücher selbst liegen in eigenen Repositories mit eigenen Lizenzen und werden nur per Adresse geöffnet.
- Die 3D-Katze (`assets/cat/archimedes.glb`, `portrait.jpg`) entsteht vollständig aus dem Skript `tools/blender/archimedes.py` (Blender als Python-Modul, nur Werkzeug); es gibt keine fremden Modelle oder Texturen.
- Porträts sind eigene, stilisierte Zeichnungen (keine Fotos und keine Nachbildungen bekannter Bilder).
