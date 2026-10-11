# Die große Bibliothek

Eine begehbare 3D-Bibliothek im Browser. Im Foyer führen drei Türen in die Fachräume **Geschichte**, **Biologie** und **Chemie**. In den Regalen stehen selbst gebaute Popup-Bücher für Klasse 5/6, an den Wänden hängen Papierschnitt-Porträts berühmter Menschen, in Vitrinen stehen Fundstücke. Die Bibliothekskatze **Archimedes** begleitet den Besuch.

- **Online ansehen** (nach dem Einschalten von GitHub Pages, siehe unten): https://wilski54.github.io/Bibliothek/
- **Eine Datei:** `dist/index.html` (alles eingebettet, nur ein paar MB). Läuft auch von der Festplatte und auf dem iPad (Safari).
- **Keine externen Anfragen.** Keine Cookies, kein Tracking, keine Bibliotheken oder Schriften aus dem Netz. Nur wenn man ein Popup-Buch öffnet, lädt die Seite dessen Adresse (in einem Fenster über der Bibliothek, mit Ausweichknopf „In neuem Tab öffnen“).
- Alles (Räume, Möbel, Texturen, Porträts, Exponate, Klänge) entsteht im Code. Es gibt keine Bilddateien.

## Bedienung

| Was | Wie |
|---|---|
| Umschauen | Ziehen mit Finger oder Maus (rundherum), Zwei-Finger-Zoom oder Mausrad |
| Hingehen | Auf Türen, Regale, Exponate antippen; oder die Raumleiste unten; Pfeile ‹ › wechseln die Station im Raum |
| Entdecken | Auf Bücher, Bilder, Vitrinen und Archimedes tippen: Karten mit Wissenswertem |
| Buch lesen | Buch antippen, „Buch öffnen“ |
| Tastatur | Pfeile (Umschauen), N / P (nächste / vorige Station), + / − (Zoom), Leertaste (Blick zurücksetzen), Esc (schließen) |
| Einstellungen | Zahnrad: Ruhiger Modus (Überblenden statt Kamerafahrt), Ton, Bildqualität. Lautsprecher-Knopf: Ton an/aus (Standard: aus) |

Adresszusatz `?q=low`, `?q=mid` oder `?q=high` erzwingt eine Bildqualität (sonst automatisch, bei Ruckeln stuft sie sich herunter). `?calm=1` startet im Ruhigen Modus.

## Ein neues Popup-Buch ins Regal stellen

Nur `src/data/books.json` ändern (Titel, Untertitel, Abteilung `geschichte|biologie|chemie`, Klassenstufe, Farbe, Motiv, Satz Beschreibung, **`url`**, `status` `fertig` oder `bald`), dann neu bauen. Bücher mit leerer `url` zeigen „Adresse noch nicht eingetragen“, Bücher mit Status `bald` stehen grau mit „Bald“-Deckel im Regal.

## Einen neuen Fachraum anlegen (z. B. Physik)

Siehe `docs/ENTWICKLUNG.md`: Raum in `src/world/layout.js` eintragen (Maße, Lage, Farbe), `src/world/rooms/<name>.js` mit `buildDept()` schreiben, Tür im Foyer ergänzen, Raumleiste und Lageplan erweitern.

## Selbst bauen

```
npm install
node build.mjs            # -> dist/index.html (minifiziert)
node build.mjs --dev      # unminifiziert
node tools/shots.mjs foyer-eingang   # Screenshot einer Station (Software-Rendering)
node tools/test-nav.mjs && node tools/test-tap.mjs
```

## Veröffentlichen mit GitHub Pages

`node build.mjs && bash tools/publish-pages.sh` schreibt `dist/index.html` auf den Branch `gh-pages`. Einmalig auf GitHub: **Settings → Pages → Source: Deploy from a branch → Branch `gh-pages`, Ordner `/ (root)`**.

## Lizenzen

Code und im Code erzeugte Kunst: MIT (`LICENSE`). Texte und Karten: CC BY-SA 4.0 (`LICENSE-CONTENT`). Einzelheiten und Bestandteile von Dritten: `NOTICE.md`.
