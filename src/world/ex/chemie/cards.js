// Karten (Texte) der Ausstellungsstücke im Chemielabor. Kindgerecht, fachlich geprüft, Unsicheres im Feld src.
// Bilder (Skizzen) werden erst beim Öffnen gezeichnet (Getter).
import { bunsenDiagram, distillDiagram, naclDiagram, bohrDiagram } from './diagrams.js';

const lazy = (draw) => { let c = null; return () => (c ||= draw()); };
const base = { kind: 'info', tag: 'Chemie', dept: 'chemie', factLabel: 'Wusstest du? ' };

export function makeCards(ctx, st) {
  const bunsenImg = lazy(bunsenDiagram), distImg = lazy(distillDiagram), naclImg = lazy(naclDiagram), bohrImg = lazy(bohrDiagram);
  const aeg = () => ctx.books.find((b) => b.id === 'aegypten');
  return {
    labortisch: {
      ...base, title: 'Der Labortisch', sub: 'Hier wird experimentiert', station: st.labortisch, label: 'Labortisch',
      paras: ['Auf diesem langen Tisch stehen Glasgeräte, ein Bunsenbrenner und eine Destillationsapparatur, so wie man sie in einem Chemielabor braucht.', 'Im Labor gelten feste Regeln: Schutzbrille auf, lange Haare zusammenbinden, nichts essen oder trinken und nur experimentieren, wenn eine Lehrkraft dabei ist.'],
      fact: 'Auch Chemikerinnen und Chemiker mit jahrzehntelanger Erfahrung tragen im Labor immer eine Schutzbrille.',
    },
    glas: {
      ...base, title: 'Glasgeräte im Labor', sub: 'Erlenmeyerkolben, Rundkolben, Becherglas, Messzylinder', station: st.labortisch, label: 'Glasgeräte',
      paras: ['Der Erlenmeyerkolben hat einen schmalen Hals, damit beim Schwenken nichts herausspritzt. Er ist nach dem Chemiker Emil Erlenmeyer benannt, der ihn 1860 vorstellte.', 'Im Rundkolben lassen sich Flüssigkeiten gleichmäßig erhitzen. Das Becherglas ist der Allrounder, und im Messzylinder liest man Volumen ab.', 'Laborglas besteht meist aus Borosilikatglas. Es verträgt Hitze und schnelle Temperaturwechsel gut.'],
      fact: 'Die Skala auf einem Becherglas ist nur ungefähr richtig. Genau misst man mit dem Messzylinder, der Pipette oder der Bürette.',
    },
    reagenz: {
      ...base, title: 'Reagenzgläser mit Lösungen', sub: 'Farben im Ständer', station: st.labortisch, label: 'Reagenzglasständer',
      paras: ['Reagenzgläser sind kleine Glasröhrchen für Versuche mit wenig Stoff. Im Ständer stehen sie sicher, und man kann Flüssigkeiten gut vergleichen.', 'Die Farben stammen von gelösten Stoffen. Eine Kupfersulfat-Lösung ist zum Beispiel blau, eine Kaliumpermanganat-Lösung violett und eine Kaliumdichromat-Lösung orange.'],
      fact: 'Beim Erhitzen darf die Öffnung des Reagenzglases nie auf einen Menschen zeigen, denn heiße Flüssigkeit kann herausspritzen.',
      src: 'Die Farben im Ständer sind nur Schmuck. Welche Lösung in welchem Glas steckt, ist nicht festgelegt.',
    },
    bunsen: {
      ...base, title: 'Der Bunsenbrenner', sub: 'Mit der Luftzufuhr die Flamme regeln', station: st.labortisch, label: 'Bunsenbrenner', wide: true, alt: 'Skizze: Bunsenbrenner mit offener und mit geschlossener Luftzufuhr',
      get image() { return bunsenImg(); },
      paras: ['Beim Bunsenbrenner strömt Gas durch eine Düse nach oben und saugt dabei durch das Luftloch Luft an. Mit der drehbaren Manschette regelt man, wie viel Luft dem Gas beigemischt wird.', 'Ist die Luftzufuhr offen, verbrennt das Gemisch fast vollständig. Die Flamme ist blau, rauscht und ist sehr heiß, weit über 1000 °C. Ist die Luftzufuhr geschlossen, brennt das Gas mit gelber, leuchtender Flamme. Sie ist kälter und setzt Ruß ab.', 'Benannt ist der Brenner nach Robert Bunsen (1811–1899). Seine heutige Form entstand um 1855 in Heidelberg mit Bunsens Mechaniker Peter Desaga.'],
      fact: 'Die gelbe Flamme heißt auch Sicherheitsflamme. Man sieht sie gut, deshalb stellt man den Brenner darauf ein, wenn man ihn gerade nicht braucht.',
    },
    destillation: {
      ...base, title: 'Destillation mit dem Liebig-Kühler', sub: 'Gemische nach der Siedetemperatur trennen', station: st.destillation, label: 'Destillationsapparatur', wide: true, alt: 'Skizze einer Destillationsapparatur mit Liebig-Kühler',
      get image() { return distImg(); },
      paras: ['Ein Gemisch aus Stoffen mit verschiedenen Siedetemperaturen kann man durch Destillieren trennen. Im Siedekolben wird es erhitzt, und der Stoff mit der niedrigeren Siedetemperatur verdampft zuerst. Alkohol siedet zum Beispiel bei etwa 78 °C, Wasser erst bei 100 °C.', 'Der Dampf strömt durch das Seitenrohr in den Liebig-Kühler. Dort kühlt ihn das Wasser im Mantel ab, bis er wieder flüssig wird. Das Destillat tropft in die Vorlage.', 'Das Thermometer misst die Temperatur des Dampfes, deshalb sitzt seine Kugel in Höhe des Seitenrohrs. Siedesteine verhindern, dass die Flüssigkeit plötzlich überkocht. Das Kühlwasser fließt unten hinein und oben hinaus, so ist der Mantel immer voll.'],
      fact: 'So gewinnt man auch destilliertes Wasser. Der Kühler ist nach Justus von Liebig benannt, der ihn im 19. Jahrhundert bekannt machte.',
      src: 'Die Grundidee des Kühlers ist älter als Liebig; er trägt seinen Namen, weil Liebig ihn bekannt machte.',
    },
    nacl: {
      ...base, title: 'Das Kochsalz-Gitter', sub: 'Natriumchlorid (NaCl), ein Salz aus Ionen', station: st.kristalle, label: 'Kochsalz-Gitter (NaCl)', wide: true, alt: 'Skizze des NaCl-Gitters mit den sechs Nachbarn eines Ions',
      get image() { return naclImg(); },
      paras: ['Kochsalz besteht aus winzigen geladenen Teilchen, den Ionen: positiven Natrium-Ionen (Na⁺) und negativen Chlorid-Ionen (Cl⁻).', 'Sie sitzen abwechselnd in einem würfelförmigen Gitter. Jedes Ion im Innern ist von sechs Ionen der anderen Sorte umgeben, denn Plus und Minus ziehen sich an.', 'Im Modell sind die kleinen blauvioletten Kugeln die Natrium-Ionen und die großen grünen die Chlorid-Ionen. Die Größen sind nur ungefähr maßstäblich, und die Stäbe gibt es in Wirklichkeit nicht.'],
      fact: 'Unter der Lupe sehen Salzkörner wie winzige Würfel aus. Das liegt am würfelförmigen Gitter.',
      src: 'Vereinfachtes Kugel-Stab-Modell: Ausschnitt mit 4 × 4 × 4 Ionen, Radien und Abstände nicht maßstäblich.',
    },
    kupfersulfat: {
      ...base, title: 'Kupfersulfat-Kristall', sub: 'CuSO₄ · 5 H₂O (Kupfer(II)-sulfat-Pentahydrat)', station: st.kristalle, label: 'Kupfersulfat-Kristall',
      paras: ['Dieser leuchtend blaue Kristall enthält Wasser in seinem Gitter: Auf jedes Kupfersulfat-Teilchen kommen fünf Wassermoleküle (Kristallwasser). Er wächst schief, nicht in Würfelform.', 'Erhitzt man ihn, entweicht das Wasser und er wird weiß. Gibt man Wasser dazu, wird er wieder blau. So lässt sich Wasser nachweisen.', 'Kupfersulfat ist gesundheitsschädlich und giftig für Wasserlebewesen. Im Labor geht man nur mit Schutzbrille und Anleitung damit um.'],
      fact: 'Früher hieß der blaue Kristall „Blauer Vitriol“ oder Kupfervitriol.',
      src: 'Die Form im Modell ist nur grob einem schiefen (triklinen) Kristall nachempfunden.',
    },
    natron: {
      ...base, title: 'Natron und Salz', sub: 'Ein natürliches Salzgemisch', station: st.kristalle, label: 'Natron',
      paras: ['Natron entsteht, wenn salzige Seen in heißen Gegenden austrocknen. Es ist ein Gemisch natürlicher Salze, vor allem Natriumcarbonat und Natriumhydrogencarbonat, dazu etwas Kochsalz und andere Salze.', 'Die alten Ägypter sammelten es zum Beispiel im Wadi Natrun. Bei der Mumifizierung bedeckten sie den Körper damit. Das Salz entzog ihm Wasser und trocknete ihn aus.', 'Das „Natron“ aus dem Supermarkt ist dagegen reines Natriumhydrogencarbonat (Backnatron).'],
      fact: 'Im Teig lässt Natron den Kuchen aufgehen, denn mit Säure bildet es Kohlenstoffdioxid.',
      src: 'Die Zusammensetzung von Natron schwankt je nach Fundort. Das Mineral Natron ist Natriumcarbonat-Decahydrat (Na₂CO₃ · 10 H₂O); das Natron der alten Ägypter war ein Salzgemisch.',
      get actions() { const b = aeg(); return b ? [{ label: 'Natron im Ägypten-Buch', fn: () => ctx.ui.openCard({ kind: 'book', book: b }) }] : []; },
    },
    atom: {
      ...base, title: 'Atommodell: Natrium', sub: 'Bohrsches Schalenmodell, vereinfacht', station: st.atom, label: 'Atommodell (Natrium)', wide: true, alt: 'Schalenmodell eines Natrium-Atoms',
      get image() { return bohrImg(); },
      paras: ['Jedes Atom hat einen winzigen, schweren Kern aus Protonen (positiv) und Neutronen (ungeladen). Außen herum bewegen sich die Elektronen (negativ).', 'Dieses Modell zeigt ein Natrium-Atom: 11 Protonen und 12 Neutronen im Kern, 11 Elektronen auf drei Schalen (2, 8 und 1). Das einzelne Elektron außen gibt Natrium leicht ab. So wird aus dem Atom das Natrium-Ion Na⁺ im Kochsalz.', 'Das Modell ist stark vereinfacht: In Wirklichkeit laufen Elektronen nicht auf festen Bahnen, und der Kern ist viel winziger, als er hier aussieht.'],
      fact: 'Wäre der Kern so groß wie eine Erbse, hätte das ganze Atom mehrere hundert Meter Durchmesser. Fast alles im Atom ist leerer Raum.',
      src: 'Niels Bohr entwarf sein Atommodell 1913. Hier ist es nur als Skulptur gedacht, Bahnen und Größen sind nicht maßstäblich.',
    },
    waage: {
      ...base, title: 'Die Waage: Nichts geht verloren', sub: 'Antoine Lavoisier und die Massenerhaltung', station: st.waage, label: 'Balkenwaage',
      paras: ['Antoine Lavoisier (1743–1794) wog bei seinen Versuchen alles sehr genau. Er zeigte: Reagieren Stoffe in einem geschlossenen Gefäß, ist die Gesamtmasse danach genauso groß wie davor.', 'Das nennt man Massenerhaltung. Es verschwindet nichts, und nichts entsteht aus dem Nichts. Die Stoffe ordnen sich nur neu.', 'Wenn eine Kerze „verschwindet“, entweichen die Verbrennungsprodukte als Gase in die Luft. Fängt man alles auf, bleibt die Masse gleich.'],
      fact: 'Brennt man Eisenwolle, wird sie schwerer. Das Eisen verbindet sich dabei mit Sauerstoff aus der Luft.',
    },
    kupfer: {
      ...base, title: 'Kupferrohre', sub: 'Kupfer (Cu), Ordnungszahl 29', station: st.periodensystem, label: 'Kupferrohre',
      paras: ['Kupfer leitet Wärme und Strom sehr gut und rostet nicht. Deshalb baut man Wasserleitungen und Kabel daraus.', 'Mit der Zeit überzieht sich Kupfer mit einer grünen Schicht, der Patina. Sie schützt das Metall darunter.'],
      fact: 'Die grünen Kupferdächer alter Kirchen sind keine Farbe, sondern Patina.',
    },
  };
}
