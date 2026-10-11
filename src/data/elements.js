// Periodensystem der Elemente: alle 118 Elemente mit deutschen Namen (IUPAC), Kategorie, Atommasse und Aggregatzustand bei 25 °C.
// Reine Daten, keine Abhängigkeit von DOM oder three.js (läuft auch unter Node für den Selbsttest).
//
// Zeilenformat in T: [Ordnungszahl, Symbol, Name, Kategorie, Atommasse, Zustand]
//   Kategorie: ak Alkalimetall, ea Erdalkalimetall, ub Übergangsmetall, um übriges Metall, hm Halbmetall, nm Nichtmetall,
//              hg Halogen, eg Edelgas, la Lanthanoid, ac Actinoid
//   Atommasse: Zahl = IUPAC-Standardwert (gerundet auf die übliche Tafel-Genauigkeit);
//              Text '[NNN]' = Massenzahl des langlebigsten Isotops (Element ohne stabile Kerne, kein Standardwert);
//              null = bei den superschweren Elementen nicht festgelegt
//   Zustand bei 25 °C: f fest, l flüssig, g gasförmig, u nicht bekannt (zu wenig Material untersucht)
const T = [
  [1, 'H', 'Wasserstoff', 'nm', 1.008, 'g'], [2, 'He', 'Helium', 'eg', 4.003, 'g'],
  [3, 'Li', 'Lithium', 'ak', 6.94, 'f'], [4, 'Be', 'Beryllium', 'ea', 9.012, 'f'], [5, 'B', 'Bor', 'hm', 10.81, 'f'], [6, 'C', 'Kohlenstoff', 'nm', 12.011, 'f'],
  [7, 'N', 'Stickstoff', 'nm', 14.007, 'g'], [8, 'O', 'Sauerstoff', 'nm', 15.999, 'g'], [9, 'F', 'Fluor', 'hg', 18.998, 'g'], [10, 'Ne', 'Neon', 'eg', 20.180, 'g'],
  [11, 'Na', 'Natrium', 'ak', 22.990, 'f'], [12, 'Mg', 'Magnesium', 'ea', 24.305, 'f'], [13, 'Al', 'Aluminium', 'um', 26.982, 'f'], [14, 'Si', 'Silicium', 'hm', 28.085, 'f'],
  [15, 'P', 'Phosphor', 'nm', 30.974, 'f'], [16, 'S', 'Schwefel', 'nm', 32.06, 'f'], [17, 'Cl', 'Chlor', 'hg', 35.45, 'g'], [18, 'Ar', 'Argon', 'eg', 39.95, 'g'],
  [19, 'K', 'Kalium', 'ak', 39.098, 'f'], [20, 'Ca', 'Calcium', 'ea', 40.078, 'f'], [21, 'Sc', 'Scandium', 'ub', 44.956, 'f'], [22, 'Ti', 'Titan', 'ub', 47.867, 'f'],
  [23, 'V', 'Vanadium', 'ub', 50.942, 'f'], [24, 'Cr', 'Chrom', 'ub', 51.996, 'f'], [25, 'Mn', 'Mangan', 'ub', 54.938, 'f'], [26, 'Fe', 'Eisen', 'ub', 55.845, 'f'],
  [27, 'Co', 'Cobalt', 'ub', 58.933, 'f'], [28, 'Ni', 'Nickel', 'ub', 58.693, 'f'], [29, 'Cu', 'Kupfer', 'ub', 63.546, 'f'], [30, 'Zn', 'Zink', 'ub', 65.38, 'f'],
  [31, 'Ga', 'Gallium', 'um', 69.723, 'f'], [32, 'Ge', 'Germanium', 'hm', 72.630, 'f'], [33, 'As', 'Arsen', 'hm', 74.922, 'f'], [34, 'Se', 'Selen', 'nm', 78.971, 'f'],
  [35, 'Br', 'Brom', 'hg', 79.904, 'l'], [36, 'Kr', 'Krypton', 'eg', 83.798, 'g'], [37, 'Rb', 'Rubidium', 'ak', 85.468, 'f'], [38, 'Sr', 'Strontium', 'ea', 87.62, 'f'],
  [39, 'Y', 'Yttrium', 'ub', 88.906, 'f'], [40, 'Zr', 'Zirconium', 'ub', 91.224, 'f'], [41, 'Nb', 'Niob', 'ub', 92.906, 'f'], [42, 'Mo', 'Molybdän', 'ub', 95.95, 'f'],
  [43, 'Tc', 'Technetium', 'ub', '[98]', 'f'], [44, 'Ru', 'Ruthenium', 'ub', 101.07, 'f'], [45, 'Rh', 'Rhodium', 'ub', 102.906, 'f'], [46, 'Pd', 'Palladium', 'ub', 106.42, 'f'],
  [47, 'Ag', 'Silber', 'ub', 107.868, 'f'], [48, 'Cd', 'Cadmium', 'ub', 112.414, 'f'], [49, 'In', 'Indium', 'um', 114.818, 'f'], [50, 'Sn', 'Zinn', 'um', 118.71, 'f'],
  [51, 'Sb', 'Antimon', 'hm', 121.76, 'f'], [52, 'Te', 'Tellur', 'hm', 127.60, 'f'], [53, 'I', 'Iod', 'hg', 126.904, 'f'], [54, 'Xe', 'Xenon', 'eg', 131.293, 'g'],
  [55, 'Cs', 'Caesium', 'ak', 132.905, 'f'], [56, 'Ba', 'Barium', 'ea', 137.327, 'f'],
  [57, 'La', 'Lanthan', 'la', 138.905, 'f'], [58, 'Ce', 'Cer', 'la', 140.116, 'f'], [59, 'Pr', 'Praseodym', 'la', 140.908, 'f'], [60, 'Nd', 'Neodym', 'la', 144.242, 'f'],
  [61, 'Pm', 'Promethium', 'la', '[145]', 'f'], [62, 'Sm', 'Samarium', 'la', 150.36, 'f'], [63, 'Eu', 'Europium', 'la', 151.964, 'f'], [64, 'Gd', 'Gadolinium', 'la', 157.25, 'f'],
  [65, 'Tb', 'Terbium', 'la', 158.925, 'f'], [66, 'Dy', 'Dysprosium', 'la', 162.50, 'f'], [67, 'Ho', 'Holmium', 'la', 164.930, 'f'], [68, 'Er', 'Erbium', 'la', 167.259, 'f'],
  [69, 'Tm', 'Thulium', 'la', 168.934, 'f'], [70, 'Yb', 'Ytterbium', 'la', 173.045, 'f'], [71, 'Lu', 'Lutetium', 'la', 174.967, 'f'],
  [72, 'Hf', 'Hafnium', 'ub', 178.49, 'f'], [73, 'Ta', 'Tantal', 'ub', 180.948, 'f'], [74, 'W', 'Wolfram', 'ub', 183.84, 'f'], [75, 'Re', 'Rhenium', 'ub', 186.207, 'f'],
  [76, 'Os', 'Osmium', 'ub', 190.23, 'f'], [77, 'Ir', 'Iridium', 'ub', 192.217, 'f'], [78, 'Pt', 'Platin', 'ub', 195.084, 'f'], [79, 'Au', 'Gold', 'ub', 196.967, 'f'],
  [80, 'Hg', 'Quecksilber', 'ub', 200.592, 'l'], [81, 'Tl', 'Thallium', 'um', 204.38, 'f'], [82, 'Pb', 'Blei', 'um', 207.2, 'f'], [83, 'Bi', 'Bismut', 'um', 208.980, 'f'],
  [84, 'Po', 'Polonium', 'um', '[209]', 'f'], [85, 'At', 'Astat', 'hg', '[210]', 'u'], [86, 'Rn', 'Radon', 'eg', '[222]', 'g'],
  [87, 'Fr', 'Francium', 'ak', '[223]', 'u'], [88, 'Ra', 'Radium', 'ea', '[226]', 'f'],
  [89, 'Ac', 'Actinium', 'ac', '[227]', 'f'], [90, 'Th', 'Thorium', 'ac', 232.038, 'f'], [91, 'Pa', 'Protactinium', 'ac', 231.036, 'f'], [92, 'U', 'Uran', 'ac', 238.029, 'f'],
  [93, 'Np', 'Neptunium', 'ac', '[237]', 'f'], [94, 'Pu', 'Plutonium', 'ac', '[244]', 'f'], [95, 'Am', 'Americium', 'ac', '[243]', 'f'], [96, 'Cm', 'Curium', 'ac', '[247]', 'f'],
  [97, 'Bk', 'Berkelium', 'ac', '[247]', 'f'], [98, 'Cf', 'Californium', 'ac', '[251]', 'f'], [99, 'Es', 'Einsteinium', 'ac', '[252]', 'u'], [100, 'Fm', 'Fermium', 'ac', '[257]', 'u'],
  [101, 'Md', 'Mendelevium', 'ac', '[258]', 'u'], [102, 'No', 'Nobelium', 'ac', '[259]', 'u'], [103, 'Lr', 'Lawrencium', 'ac', '[266]', 'u'],
  [104, 'Rf', 'Rutherfordium', 'ub', null, 'u'], [105, 'Db', 'Dubnium', 'ub', null, 'u'], [106, 'Sg', 'Seaborgium', 'ub', null, 'u'], [107, 'Bh', 'Bohrium', 'ub', null, 'u'],
  [108, 'Hs', 'Hassium', 'ub', null, 'u'], [109, 'Mt', 'Meitnerium', 'ub', null, 'u'], [110, 'Ds', 'Darmstadtium', 'ub', null, 'u'], [111, 'Rg', 'Roentgenium', 'ub', null, 'u'],
  [112, 'Cn', 'Copernicium', 'ub', null, 'u'], [113, 'Nh', 'Nihonium', 'um', null, 'u'], [114, 'Fl', 'Flerovium', 'um', null, 'u'], [115, 'Mc', 'Moscovium', 'um', null, 'u'],
  [116, 'Lv', 'Livermorium', 'um', null, 'u'], [117, 'Ts', 'Tenness', 'hg', null, 'u'], [118, 'Og', 'Oganesson', 'eg', null, 'u'],
];

// Kategorien: Name (Plural für die Legende), Einzahl (für die Karte), Tafelfarbe
export const CATS = {
  ak: { name: 'Alkalimetalle', one: 'Alkalimetall', col: '#ff8a76' },
  ea: { name: 'Erdalkalimetalle', one: 'Erdalkalimetall', col: '#ffbd5c' },
  ub: { name: 'Übergangsmetalle', one: 'Übergangsmetall', col: '#f2e07e' },
  um: { name: 'Übrige Metalle', one: 'Metall (Hauptgruppe)', col: '#aedb76' },
  hm: { name: 'Halbmetalle', one: 'Halbmetall', col: '#5fd6b8' },
  nm: { name: 'Nichtmetalle', one: 'Nichtmetall', col: '#78bdf6' },
  hg: { name: 'Halogene', one: 'Halogen', col: '#b9a0f2' },
  eg: { name: 'Edelgase', one: 'Edelgas', col: '#f394cf' },
  la: { name: 'Lanthanoide', one: 'Lanthanoid', col: '#e9c7a2' },
  ac: { name: 'Actinoide', one: 'Actinoid', col: '#d6a9a0' },
};
export const STATES = { f: 'fest', l: 'flüssig', g: 'gasförmig', u: 'nicht bekannt' };

// Stellung im 18-Gruppen-Schema: col 1..18, row 1..7 für das Hauptfeld; row 8 (Lanthanoide) und 9 (Actinoide) für die abgesetzten Zeilen (col 4..18).
// In Periode 6 und 7 steht in Gruppe 3 (col 3) je ein Platzhalterfeld "57-71" / "89-103".
function place(z) {
  if (z === 1) return { col: 1, row: 1 };
  if (z === 2) return { col: 18, row: 1 };
  if (z >= 57 && z <= 71) return { col: 4 + (z - 57), row: 8 };
  if (z >= 89 && z <= 103) return { col: 4 + (z - 89), row: 9 };
  if (z >= 72 && z <= 86) return { col: z - 72 + 4, row: 6 };
  if (z >= 104 && z <= 118) return { col: z - 104 + 4, row: 7 };
  const first = { 3: 2, 11: 3, 19: 4, 37: 5, 55: 6, 87: 7 }; // erstes Element je Periode
  const starts = Object.keys(first).map(Number).filter((a) => a <= z).pop(), row = first[starts], k = z - starts;
  if (row <= 3) return { col: k < 2 ? k + 1 : k + 11, row }; // Perioden 2 und 3: Gruppen 1, 2 und 13..18
  return { col: k + 1, row };                                   // Perioden 4, 5 und je die ersten zwei von 6, 7
}

export const ELEMENTS = T.map(([z, sym, name, cat, mass, state]) => {
  const { col, row } = place(z);
  const group = row <= 7 ? col : null; // Gruppen 1..18 (f-Block ohne Gruppe)
  const period = row <= 7 ? row : row === 8 ? 6 : 7;
  const radio = z === 43 || z === 61 || z >= 84; // alle Atome radioaktiv
  return { z, sym, name, cat, mass, state, col, row, group, period, radio };
});
export const BY_Z = (z) => ELEMENTS[z - 1];
export const BY_SYM = Object.fromEntries(ELEMENTS.map((e) => [e.sym, e]));
// Platzhalter-Felder in der Hauptzeile (Periode 6/7, Gruppe 3)
export const PLACEHOLDERS = [{ col: 3, row: 6, cat: 'la', label: '57–71' }, { col: 3, row: 7, cat: 'ac', label: '89–103' }];

// Atommasse als Text (deutsches Dezimalkomma)
export function massText(e) {
  if (e.mass == null) return null;
  if (typeof e.mass === 'string') return e.mass;
  return String(e.mass).replace('.', ',');
}

// ---------------------------------------------------------------------------------------------------------------------------
// Individuelle Texte (Fundort/Verwendung und "Wusstest du?") für die wichtigsten Elemente.
const D = {
  H: ['Wasserstoff steckt im Wasser (H₂O) und in fast allen Stoffen von Lebewesen. Als Gas dient er als Brennstoff und zur Herstellung von Ammoniak für Dünger.', 'Wasserstoff ist das leichteste aller Elemente. Die Sonne besteht größtenteils aus Wasserstoff und verschmilzt ihn im Innern zu Helium.'],
  He: ['Helium füllt Ballons und Luftschiffe, und es kühlt die starken Magnete in Geräten für die Magnetresonanztomographie (MRT).', '1868 fand man Helium zuerst im Licht der Sonne. Erst später entdeckte man es auch auf der Erde.'],
  Li: ['Lithium steckt in den wiederaufladbaren Akkus von Handys, Laptops und Elektroautos.', 'Lithium ist das leichteste Metall. Es ist so weich, dass man es schneiden kann, und es schwimmt sogar auf Öl.'],
  Be: ['Beryllium kommt in Edelsteinen wie Smaragd und Aquamarin vor. Legierungen mit Beryllium sind leicht und sehr steif.', 'Smaragd und Aquamarin sind beides das Mineral Beryll, nur mit verschiedenen Farbstoffen.'],
  B: ['Bor steckt in Borax und Borsäure. Es macht Glas hitzebeständig.', 'Hitzefestes Laborglas (Borosilikatglas) enthält Bor und hält schnelle Temperaturwechsel gut aus.'],
  C: ['Kohlenstoff steckt in Kohle, Graphit und Diamant, im Gas Kohlenstoffdioxid und in allen Lebewesen.', 'Diamant und Bleistiftmine bestehen beide nur aus Kohlenstoff. Der Unterschied liegt darin, wie die Atome angeordnet sind.'],
  N: ['Stickstoff macht etwa vier Fünftel der Luft aus. Man braucht ihn für Dünger, und flüssig dient er zum Kühlen.', 'Flüssiger Stickstoff ist mit etwa −196 °C extrem kalt. Er kocht schon bei dieser Temperatur und verdampft deshalb ständig.'],
  O: ['Sauerstoff macht etwa ein Fünftel der Luft aus. Wir atmen ihn ein, und ein Feuer braucht ihn zum Brennen.', 'Fast die Hälfte der Masse der Erdkruste ist Sauerstoff, denn er steckt in Gestein, Sand und Wasser.'],
  F: ['Fluor kommt in Fluoriden vor, zum Beispiel im Mineral Flussspat und in Zahnpasta, wo es die Zähne vor Karies schützt.', 'Reines Fluor ist ein blassgelbes, giftiges Gas und das reaktionsfreudigste aller Elemente.'],
  Ne: ['Neon füllt Leuchtröhren und lässt sie rotorange leuchten.', 'Neon ist ein Edelgas und geht kaum Verbindungen ein. Der Name bedeutet „das Neue“.'],
  Na: ['Natrium kommt als Kochsalz (Natriumchlorid) im Meerwasser und in Salzlagern vor. Auch Natron und Soda enthalten Natrium.', 'Reines Natrium ist ein weiches Metall, das heftig mit Wasser reagiert. In einer Flamme leuchtet es gelb.'],
  Mg: ['Magnesium steckt im Blattgrün der Pflanzen und in unseren Knochen. Als leichtes Metall kommt es in Legierungen vor.', 'Brennendes Magnesium leuchtet grellweiß. Früher nutzte man es für das Blitzlicht beim Fotografieren.'],
  Al: ['Aluminium wird aus dem Erz Bauxit gewonnen. Es steckt in Folie, Getränkedosen, Fensterrahmen und Flugzeugen.', 'Aluminium ist das häufigste Metall der Erdkruste. An der Luft überzieht es sich mit einer dünnen, schützenden Oxidschicht.'],
  Si: ['Silicium steckt in Sand, Quarz und vielen Gesteinen. Aus sehr reinem Silicium macht man Computerchips und Solarzellen.', 'Nach Sauerstoff ist Silicium das zweithäufigste Element der Erdkruste.'],
  P: ['Phosphor steckt in Knochen und Zähnen, in Düngern und im Erbgut. Auf der Reibfläche von Streichholzschachteln ist roter Phosphor.', 'Hennig Brand entdeckte den Phosphor 1669 in Hamburg, als er Urin eindampfte. Der weiße Phosphor leuchtete dabei im Dunkeln.'],
  S: ['Schwefel ist ein gelber Feststoff, den man bei Vulkanen findet. Man braucht ihn für Schwefelsäure und zum Härten von Gummi.', 'Schwefel verbrennt mit blauer Flamme zu stechend riechendem Schwefeldioxid.'],
  Cl: ['Chlor steckt im Kochsalz. Als Gas desinfiziert es Trinkwasser und Schwimmbäder.', 'Chlor ist als Gas gelbgrün und giftig. Im Kochsalz dagegen ist es harmlos gebunden.'],
  Ar: ['Argon macht knapp 1 % der Luft aus. Es dient beim Schweißen als Schutzgas und füllt manche Glühlampen.', 'Der Name bedeutet „träge“ (griechisch argos), weil Argon kaum reagiert.'],
  K: ['Kalium steckt in Düngern und in Pflanzen, zum Beispiel in Bananen. Dein Körper braucht es für Nerven und Muskeln.', 'Reines Kalium reagiert sehr heftig mit Wasser. In der Flamme leuchtet es violett.'],
  Ca: ['Calcium steckt in Kalk, Kreide, Marmor, Muschel- und Eierschalen und in deinen Knochen und Zähnen.', 'Kalkstein besteht aus Calciumcarbonat. Mit Säure schäumt er auf, weil dabei Kohlenstoffdioxid entsteht.'],
  Ti: ['Titan ist leicht, fest und rostet nicht. Man baut daraus Flugzeugteile, Fahrradrahmen und künstliche Gelenke.', 'Der Körper verträgt Titan sehr gut. Deshalb werden Implantate daraus gefertigt.'],
  Cr: ['Chrom glänzt silbrig. Es verchromt Wasserhähne und macht Stahl rostfrei (Edelstahl).', 'Der Name kommt vom griechischen Wort chroma für Farbe, denn Chromverbindungen sind oft bunt.'],
  Mn: ['Mangan macht Stahl härter. Als Braunstein steckt es in manchen Batterien.', 'Die tiefviolette Lösung von Kaliumpermanganat enthält Mangan.'],
  Fe: ['Eisen wird aus Eisenerz im Hochofen gewonnen und ist der Hauptbestandteil von Stahl. Eisen ist magnetisch und rostet an feuchter Luft.', 'Dein Blut ist rot, weil im Blutfarbstoff Hämoglobin Eisen steckt.'],
  Co: ['Cobalt färbt Glas und Porzellan tiefblau (Cobaltblau) und steckt in Akkus und starken Magneten.', 'Vitamin B₁₂ enthält ein Cobalt-Atom. Dorothy Hodgkin hat seinen Aufbau mit Röntgenstrahlen entschlüsselt.'],
  Ni: ['Nickel steckt in Edelstahl, Münzen und Akkus.', 'Bergleute nannten ein Erz „Kupfernickel“, weil es wie Kupfererz aussah, aber kein Kupfer lieferte. Sie glaubten, ein Kobold namens Nickel habe es verhext.'],
  Cu: ['Kupfer leitet Strom gut und steckt in Kabeln, Rohren und Münzen. Mit Zinn gemischt ergibt es Bronze, mit Zink Messing.', 'Alte Kupferdächer sind grün: Die Patina ist eine Schicht aus Kupfersalzen, die das Metall schützt.'],
  Zn: ['Zink schützt Eisen vor Rost (Verzinken) und steckt in Batterien und im Messing.', 'Messing besteht aus Kupfer und Zink, wie die goldfarbenen Schilder in dieser Bibliothek.'],
  Ga: ['Gallium steckt in LEDs und Computerchips.', 'Gallium schmilzt schon bei knapp 30 °C. Ein Stück zerfließt in deiner Hand.'],
  Ge: ['Germanium ist ein Halbleiter. Man nutzt es für Glasfasern und Infrarot-Optiken.', 'Mendelejew sagte es als „Eka-Silicium“ voraus. 1886 entdeckte Clemens Winkler es und nannte es nach Deutschland (lateinisch Germania).'],
  As: ['Arsen ist giftig. In winzigen Mengen steckt es in Halbleitern, zum Beispiel in Galliumarsenid.', 'Arsenik war früher ein berüchtigtes Gift. Heute ist der Umgang mit Arsenverbindungen streng geregelt.'],
  Se: ['Selen braucht der Körper in winzigen Mengen. Man verwendet es auch bei der Glasherstellung.', 'Der Name kommt von Selene, dem griechischen Wort für den Mond.'],
  Br: ['Brom gewinnt man aus Salzlösungen und Meerwasser. Es steckt zum Beispiel in Flammschutzmitteln.', 'Brom ist neben Quecksilber das einzige Element, das bei Zimmertemperatur flüssig ist: rotbraun und stechend riechend.'],
  Kr: ['Krypton füllt manche Lampen und Leuchtröhren.', 'Der Name bedeutet „das Verborgene“, denn Krypton kommt in der Luft nur in winzigen Mengen vor.'],
  Ag: ['Silber steckt in Schmuck, Besteck, Münzen und Spiegeln.', 'Silber leitet Strom und Wärme besser als jedes andere Metall. An der Luft läuft es mit der Zeit schwarz an.'],
  Sn: ['Zinn überzieht das Weißblech von Konservendosen und steckt in Lot zum Löten.', 'Biegt man eine Zinnstange, knirscht es hörbar. Das nennt man den „Zinnschrei“.'],
  I: ['Iod braucht dein Körper für die Schilddrüse. Es steckt in Speisesalz mit Iod und in Desinfektionsmitteln.', 'Iod ist ein dunkler Feststoff, der beim Erhitzen violette Dämpfe bildet. Mit Stärke färbt es sich blauschwarz.'],
  Xe: ['Xenon füllt Autoscheinwerfer-Lampen und Blitzröhren.', 'Der Name bedeutet „das Fremde“. Xenon ist ein sehr seltenes Edelgas in der Luft.'],
  Cs: ['Caesium steckt in sehr genauen Atomuhren.', 'Die Sekunde ist über die Strahlung von Caesium-Atomen festgelegt. Caesium schmilzt schon bei etwa 28 °C.'],
  Ba: ['Bariumsulfat dient als Kontrastmittel beim Röntgen („Kontrastbrei“). Bariumverbindungen färben Feuerwerk grün.', 'Wasserlösliche Bariumsalze sind giftig, das wasserunlösliche Bariumsulfat dagegen nicht.'],
  Ce: ['Cer steckt in den Zündsteinen von Feuerzeugen.', 'Cer ist nach dem Zwergplaneten Ceres benannt.'],
  Nd: ['Neodym steckt in sehr starken Magneten, zum Beispiel in Kopfhörern und Windkraftanlagen.', 'Neodym bedeutet „neuer Zwilling“. Es wurde zusammen mit dem „grünen Zwilling“ Praseodym entdeckt.'],
  Gd: ['Gadolinium wird als Kontrastmittel bei MRT-Untersuchungen eingesetzt.', 'Es ist nach dem finnischen Chemiker Johan Gadolin benannt.'],
  Ta: ['Tantal steckt in winzigen Kondensatoren in Handys und Computern.', 'Der Name stammt von Tantalus, einer Gestalt der griechischen Sage.'],
  W: ['Wolfram hat den höchsten Schmelzpunkt aller Metalle (3422 °C). Deshalb bestehen die Glühdrähte alter Glühlampen daraus.', 'Das Symbol W kommt vom Namen Wolfram. Auf Englisch heißt das Element „tungsten“.'],
  Os: ['Osmium wird mit anderen Metallen zu sehr harten Legierungen gemischt, zum Beispiel für Federspitzen.', 'Osmium und Iridium sind die dichtesten Elemente. Ein Würfel von 10 cm Kantenlänge wöge mehr als 22 kg.'],
  Ir: ['Iridium ist sehr hart und beständig. Man findet es zum Beispiel in Zündkerzen.', 'In einer dünnen Gesteinsschicht, die das Ende der Dinosaurierzeit zeigt, steckt ungewöhnlich viel Iridium. Das spricht für den Einschlag eines Asteroiden.'],
  Pt: ['Platin steckt in Katalysatoren, Schmuck und Laborgeräten.', 'Platin reagiert kaum mit anderen Stoffen. Chemiker nutzen Platindrähtchen für Flammenproben.'],
  Au: ['Gold glänzt gelb und läuft nicht an. Man macht daraus Schmuck, Münzen und Kontakte in der Elektronik.', 'Gold lässt sich zu Blattgold ausschlagen, das dünner ist als ein Tausendstel Millimeter.'],
  Hg: ['Quecksilber ist ein flüssiges Metall und giftig. Früher füllte man es in Thermometer.', 'Das Symbol Hg kommt von lateinisch hydrargyrum, „flüssiges Silber“.'],
  Pb: ['Blei ist schwer und weich. Es steckt in Autobatterien und schützt als Abschirmung vor Röntgenstrahlen.', 'Das Symbol Pb kommt von lateinisch plumbum. Daher stammen Wörter wie „Plombe“ und das englische „plumber“.'],
  Bi: ['Bismut (früher Wismut genannt) steckt in niedrig schmelzenden Legierungen und in manchen Medikamenten.', 'Künstlich gezüchtete Bismut-Kristalle schillern in Regenbogenfarben.'],
  Po: ['Polonium ist stark radioaktiv und extrem selten.', 'Marie Curie entdeckte es 1898 und nannte es nach ihrem Heimatland Polen.'],
  Rn: ['Radon ist ein radioaktives Edelgas. Es entsteht im Boden aus dem Zerfall von Radium.', 'In schlecht gelüfteten Kellern kann sich Radon sammeln. Regelmäßiges Lüften hilft.'],
  Ra: ['Radium ist radioaktiv. Früher mischte man es in Leuchtfarben, zum Beispiel für Zifferblätter.', 'Marie und Pierre Curie entdeckten es 1898. Der Name kommt vom lateinischen radius, „Strahl“.'],
  Th: ['Thorium ist schwach radioaktiv. Früher steckte es in den Glühstrümpfen von Gaslampen.', 'Es ist nach dem germanischen Donnergott Thor benannt.'],
  U: ['Uran ist radioaktiv und dient als Brennstoff in Kernkraftwerken.', 'Martin Heinrich Klaproth entdeckte Uran 1789 und nannte es nach dem Planeten Uranus.'],
  Pu: ['Plutonium wird künstlich in Kernreaktoren erzeugt. Eine Sorte davon, Plutonium-238, liefert Strom für Raumsonden.', 'Benannt ist es nach dem Zwergplaneten Pluto.'],
  Am: ['Americium-241 steckt in vielen Rauchmeldern.', 'Es ist nach Amerika benannt, so wie Europium nach Europa.'],
  Tc: ['Technetium wird in der Medizin als schwach strahlender Marker genutzt, der Ärzten Organe sichtbar macht.', 'Es war das erste künstlich hergestellte Element. Der Name kommt vom griechischen technetos, „künstlich“.'],
};
// Namensherkunft (für Elemente ohne eigenen Text): kurze, gesicherte Angaben
const ORIGIN = {
  Sc: 'Scandium ist nach Skandinavien benannt, wo man seine Erze fand.',
  V: 'Vanadium ist nach Vanadis benannt, einem Beinamen der nordischen Göttin Freya.',
  Rb: 'Rubidium kommt von lateinisch rubidus, „dunkelrot“, nach den roten Linien in seinem Spektrum.',
  Sr: 'Strontium ist nach dem Ort Strontian in Schottland benannt. In der Flamme leuchtet es rot (Feuerwerk).',
  Y: 'Yttrium ist nach dem schwedischen Ort Ytterby benannt. Auch Ytterbium, Terbium und Erbium tragen Namen von dort.',
  Zr: 'Zirconium wird zum Beispiel für die Hüllen der Brennstäbe in Kernkraftwerken gebraucht.',
  Nb: 'Niob ist nach Niobe benannt, der Tochter des Tantalus, denn es kommt zusammen mit Tantal vor.',
  Mo: 'Molybdän macht Stahl besonders fest. Der Name kommt vom griechischen molybdos, „Blei“, weil man sein Erz für Bleierz hielt.',
  Ru: 'Ruthenium ist nach Ruthenia benannt, dem lateinischen Namen für Russland.',
  Rh: 'Rhodium heißt nach dem griechischen rhodon, „Rose“, wegen der rosaroten Farbe seiner Salzlösungen. Es steckt in Autokatalysatoren.',
  Pd: 'Palladium steckt in Autokatalysatoren. Es ist nach dem Asteroiden Pallas benannt.',
  Cd: 'Cadmium ist giftig und wurde früher für Akkus verwendet. Der Name stammt von „Cadmia“, einem alten Wort für Zinkerz.',
  In: 'Indium kommt von seiner indigoblauen Linie im Spektrum. Es steckt in durchsichtigen Elektroden von Bildschirmen.',
  Sb: 'Das Symbol Sb kommt vom lateinischen Namen stibium. Antimon macht Metalle härter und dient als Flammschutz.',
  Te: 'Tellur ist nach Tellus benannt, dem lateinischen Wort für Erde.',
  La: 'Lanthan kommt vom griechischen lanthanein, „verborgen sein“, denn es war lange in anderen Mineralen versteckt.',
  Pr: 'Praseodym bedeutet „grüner Zwilling“ (griechisch prasios, grün).',
  Pm: 'Promethium ist nach dem Titanen Prometheus benannt, der den Menschen das Feuer brachte.',
  Sm: 'Samarium ist nach dem Mineral Samarskit benannt.',
  Eu: 'Europium ist nach dem Kontinent Europa benannt.',
  Tb: 'Terbium ist nach dem schwedischen Ort Ytterby benannt.',
  Dy: 'Dysprosium bedeutet „schwer zugänglich“ (griechisch dysprositos), weil es so mühsam zu gewinnen war.',
  Ho: 'Holmium ist nach Holmia benannt, dem lateinischen Namen von Stockholm.',
  Er: 'Erbium ist nach dem schwedischen Ort Ytterby benannt.',
  Tm: 'Thulium ist nach Thule benannt, einem alten Namen für den hohen Norden.',
  Yb: 'Ytterbium ist nach dem schwedischen Ort Ytterby benannt.',
  Lu: 'Lutetium ist nach Lutetia benannt, dem lateinischen Namen von Paris.',
  Hf: 'Hafnium ist nach Hafnia benannt, dem lateinischen Namen von Kopenhagen.',
  Re: 'Rhenium ist nach dem Rhein benannt (lateinisch Rhenus).',
  Tl: 'Thallium kommt von griechisch thallos, „grüner Zweig“, nach seiner grünen Spektrallinie. Es ist sehr giftig.',
  At: 'Astat kommt vom griechischen astatos, „unbeständig“, denn seine Atome zerfallen schnell. Es ist das seltenste natürliche Element.',
  Fr: 'Francium ist nach Frankreich benannt. Es zerfällt so schnell, dass man nie mehr als winzige Spuren davon hatte.',
  Ac: 'Actinium kommt vom griechischen aktis, „Strahl“.',
  Pa: 'Protactinium bedeutet „Vorläufer des Actiniums“, weil es zu Actinium zerfällt.',
  Np: 'Neptunium ist nach dem Planeten Neptun benannt, der hinter Uranus kommt, so wie Neptunium im Periodensystem hinter Uran steht.',
  Cm: 'Curium ist zu Ehren von Marie und Pierre Curie benannt.',
  Bk: 'Berkelium ist nach der Stadt Berkeley in Kalifornien benannt, wo es hergestellt wurde.',
  Cf: 'Californium ist nach dem US-Bundesstaat Kalifornien benannt.',
  Es: 'Einsteinium ist zu Ehren von Albert Einstein benannt.',
  Fm: 'Fermium ist zu Ehren des Physikers Enrico Fermi benannt.',
  Md: 'Mendelevium ist zu Ehren von Dmitri Mendelejew benannt, dem „Vater“ des Periodensystems.',
  No: 'Nobelium ist zu Ehren von Alfred Nobel benannt.',
  Lr: 'Lawrencium ist zu Ehren des Physikers Ernest Lawrence benannt.',
  Rf: 'Rutherfordium ist zu Ehren des Physikers Ernest Rutherford benannt.',
  Db: 'Dubnium ist nach der russischen Stadt Dubna benannt, wo ein großes Kernforschungsinstitut steht.',
  Sg: 'Seaborgium ist zu Ehren des Chemikers Glenn Seaborg benannt.',
  Bh: 'Bohrium ist zu Ehren des Physikers Niels Bohr benannt.',
  Hs: 'Hassium ist nach dem Land Hessen benannt (lateinisch Hassia). Es wurde in Darmstadt hergestellt.',
  Mt: 'Meitnerium ist zu Ehren der Physikerin Lise Meitner benannt.',
  Ds: 'Darmstadtium ist nach der Stadt Darmstadt benannt, wo es hergestellt wurde.',
  Rg: 'Roentgenium ist zu Ehren von Wilhelm Conrad Röntgen benannt, dem Entdecker der Röntgenstrahlen.',
  Cn: 'Copernicium ist zu Ehren von Nikolaus Kopernikus benannt.',
  Nh: 'Nihonium ist nach „Nihon“ benannt, dem japanischen Namen für Japan. Es war das erste in Asien entdeckte Element.',
  Fl: 'Flerovium ist nach dem Flerov-Labor für Kernreaktionen in Dubna benannt.',
  Mc: 'Moscovium ist nach dem Moskauer Gebiet benannt.',
  Lv: 'Livermorium ist nach dem Lawrence Livermore National Laboratory in Kalifornien benannt.',
  Ts: 'Tenness ist nach dem US-Bundesstaat Tennessee benannt.',
  Og: 'Oganesson ist zu Ehren des Kernphysikers Juri Oganessjan benannt. Es ist das schwerste bekannte Element.',
};
// Hinweise zur Einordnung (für das Feld src der Karte)
const NOTE = {
  Tc: 'Die Zahl in Klammern ist die Massenzahl des langlebigsten Isotops, nicht ein Standardwert.',
  Ts: 'Tenness gehört nach seiner Stellung zur Gruppe 17 (Halogene). Seine Eigenschaften sind kaum untersucht.',
  Nh: 'Die Einordnung der Elemente 113 bis 116 als „übrige Metalle“ folgt ihrer Stellung im Periodensystem; ihre Eigenschaften sind kaum untersucht.',
  Fl: 'Die Einordnung der Elemente 113 bis 116 als „übrige Metalle“ folgt ihrer Stellung im Periodensystem; ihre Eigenschaften sind kaum untersucht.',
  Mc: 'Die Einordnung der Elemente 113 bis 116 als „übrige Metalle“ folgt ihrer Stellung im Periodensystem; ihre Eigenschaften sind kaum untersucht.',
  Lv: 'Die Einordnung der Elemente 113 bis 116 als „übrige Metalle“ folgt ihrer Stellung im Periodensystem; ihre Eigenschaften sind kaum untersucht.',
  Lr: 'Bei den schweren Actinoiden schwanken die Massenzahlen je nach Quelle; angegeben ist das langlebigste bekannte Isotop.',
};

const ART = { f: 'fest', l: 'flüssig', g: 'gasförmig' };

// Karte (tap-Objekt kind:'info') für ein Element. image: Funktion, die ein Canvas liefert (Aufrufer, damit diese Datei ohne DOM läuft)
export function elementCard(z, { image } = {}) {
  const e = BY_Z(z); if (!e) return null;
  const cat = CATS[e.cat], d = D[e.sym];
  const stellung = e.group ? `Periode ${e.period}, Gruppe ${e.group}` : `Periode ${e.period} (abgesetzte Zeile unter dem Hauptfeld)`;
  const mt = massText(e);
  const massLine = mt == null ? 'Atommasse: nicht festgelegt, denn es gibt nur wenige, sehr kurzlebige Atome.'
    : typeof e.mass === 'string' ? `Atommasse: ${mt} u (Massenzahl des langlebigsten Isotops, denn das Element hat keine stabilen Atomkerne).`
      : `Atommasse: ${mt} u.`;
  const state = e.state === 'u' ? 'Aggregatzustand bei 25 °C: nicht bekannt, weil bisher zu wenig Material untersucht wurde.' : `Aggregatzustand bei 25 °C: ${ART[e.state]}.`;
  const paras = [`${massLine} ${state}`];
  let fact;
  if (d) { paras.push(d[0]); fact = d[1]; } else {
    if (e.radio) paras.push('Alle Atome dieses Elements sind radioaktiv.');
    if (e.z >= 93 && e.z <= 118 && e.z !== 92) paras.push('Dieses Element kommt in der Natur praktisch nicht vor und wird künstlich in Kernreaktoren oder Teilchenbeschleunigern hergestellt.');
    fact = ORIGIN[e.sym] || `Die Ordnungszahl ${e.z} verrät: Jedes Atom von ${e.name} hat ${e.z} Protonen im Kern.`;
  }
  const noteSrc = NOTE[e.sym];
  return {
    kind: 'info', tag: 'Chemie', dept: 'chemie', title: `${e.name} (${e.sym})`, sub: `Ordnungszahl ${e.z} · ${cat.one} · ${stellung}`,
    paras, fact, factLabel: 'Wusstest du? ', alt: `${e.name}, Symbol ${e.sym}, Ordnungszahl ${e.z}`,
    src: (d ? '' : 'Allgemeine Angaben ohne eigenen Fachtext. ') + 'Atommassen: IUPAC-Standardwerte, gerundet.' + (noteSrc ? ' ' + noteSrc : ''),
    label: `${e.name} (${e.sym})`,
    image: image ? image(e) : undefined,
  };
}
export const INDIVIDUAL = Object.keys(D);
