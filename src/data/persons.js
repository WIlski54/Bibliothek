// Persönlichkeiten für die Porträts in den Fachräumen (Papierschnitt-Bilder zeichnet src/art/portrait/ aus dem Feld look).
// Felder: id, dept, name, years, role (eine Zeile), paras (2 bis 3 kurze Absätze), fact ("Wusstest du?"),
//         uncertain (ehrlicher Hinweis auf Unsicheres und darauf, dass das Bild eine Zeichnung ist), look (Zeichenparameter).
// look: skin (Hautton), age 0..1 (Falten), female, blush, face {w,h,jaw,chin,cheek,dome}, eyes {col,size,kohl}, brow {col,thick,arch},
//       hair {style,col,...}, beard/sideburns/stache {col,...}, hat {style,...}, glasses, dress {style,col,...}, props [..], bg {id, c:[Farben]}.
// Die Porträts sind frei gezeichnete Kunstwerke, keine Nachbildungen von Fotos oder Gemälden.
export const PERSONS = {
  herodot: {
    id: 'herodot', dept: 'geschichte', name: 'Herodot', years: 'um 484 – um 425 v. Chr.', role: 'Der „Vater der Geschichtsschreibung“',
    paras: [
      'Herodot kam aus Halikarnassos, einer griechischen Stadt im Westen der heutigen Türkei. Er reiste durch viele Länder, auch nach Ägypten, und schrieb auf, was er sah und was die Menschen ihm erzählten.',
      'Sein großes Werk heißt „Historien“. Das griechische Wort historia bedeutet „Erkundung“ oder „Nachforschung“, und daher kommt unser Wort „Historie“. Weil er so viel Wissen sammelte, nennt man ihn bis heute den „Vater der Geschichtsschreibung“.',
      'Manches hat er nur gehört und nicht selbst nachgeprüft, deshalb stimmt nicht alles, was er schreibt. Trotzdem wüssten wir ohne ihn viel weniger über die Welt vor rund 2500 Jahren.',
    ],
    fact: 'Herodot schrieb, Ägypten sei „ein Geschenk des Nils“. Ohne die Nilflut, die jedes Jahr fruchtbaren Schlamm brachte, gäbe es dort fast nur Wüste.',
    uncertain: 'Wie Herodot wirklich aussah, wissen wir nicht sicher. Es gibt antike Büsten mit Bart, aber das Bild hier ist eine freie Zeichnung. Auch seine Lebensdaten sind nur ungefähr bekannt.',
    look: {
      props: ['rolle'], skin: '#d9a77a', age: 0.5, face: { w: 1.02, cheek: 0.2 }, eyes: { col: '#4a3a2a' }, brow: { col: '#6a5a4a', thick: 1.2 },
      hair: { style: 'wellig', col: '#8a7a68', sdrop: 0.1, flare: 0.1, back: false, bump: { amp: 6, wl: 24 } }, hat: { style: 'band', col: '#a8433a' },
      beard: { style: 'voll', col: '#8a7a68', len: 0.1, curl: 4, wl: 18 }, stache: { col: '#8a7a68', droop: 0.04 },
      dress: { style: 'himation', col: '#c9a05a', under: '#efe4cc', trim: '#2f4f7a' }, bg: { id: 'meer', c: ['#cfe4e8', '#3f7f9a', '#e8c25a'] },
    },
  },
  kleopatra: {
    id: 'kleopatra', dept: 'geschichte', name: 'Kleopatra VII.', years: '69 – 30 v. Chr.', role: 'Letzte Königin des ptolemäischen Ägypten',
    paras: [
      'Kleopatra gehörte zur Familie der Ptolemäer. Ihr Vorfahr Ptolemaios war ein General Alexanders des Großen und wurde König von Ägypten. Die Familie sprach Griechisch und regierte von der Hafenstadt Alexandria aus.',
      'Kleopatra war klug und gebildet. Der Schriftsteller Plutarch berichtet, sie habe viele Sprachen gesprochen und als Erste ihrer Familie auch Ägyptisch gelernt.',
      'Sie regierte als Königin und verhandelte mit mächtigen Römern wie Caesar und Marcus Antonius. Nach ihrem Tod im Jahr 30 v. Chr. wurde Ägypten eine Provinz des Römischen Reiches.',
    ],
    fact: 'Kleopatra lebte zeitlich näher an uns als am Bau der großen Pyramide: Die Cheops-Pyramide war zu ihrer Zeit schon rund 2500 Jahre alt, seit Kleopatra sind es etwa 2000 Jahre.',
    uncertain: 'Wie Kleopatra wirklich aussah, wissen wir nicht genau. Es gibt Münzbilder und einige Skulpturen, aber keine sichere Darstellung; das Bild ist eine Zeichnung. Diadem, Schlange und breiter Kragen zeigen, wie sich Königinnen damals darstellen ließen. Auch wie sie starb, ist nicht sicher überliefert.',
    look: {
      skin: '#d2a27a', age: 0.1, female: true, face: { w: 0.94, chin: 0.2, jaw: -0.3 }, eyes: { col: '#2a1c12', size: 1.1, kohl: true }, brow: { col: '#2a1c12', thick: 0.9 },
      hair: { style: 'melone', col: '#2a1e1a' }, hat: { style: 'diadem', col: '#e2b64a' }, dress: { style: 'usech', col: '#f4efe2' }, bg: { id: 'nil', c: ['#1f3f78', '#e2b64a', '#4a9a6a'] },
    },
  },
  champollion: {
    id: 'champollion', dept: 'geschichte', name: 'Jean-François Champollion', years: '1790 – 1832', role: 'Entzifferte die ägyptischen Hieroglyphen',
    paras: [
      'Champollion wuchs in Frankreich auf und lernte schon als Junge alte Sprachen, zum Beispiel Hebräisch, Arabisch und Koptisch. Sein großer Wunsch war, die Schrift der alten Ägypter lesen zu können.',
      'Dabei half ihm der Stein von Rosette: Auf ihm steht derselbe Text in drei Schriften, in Hieroglyphen, in einer Alltagsschrift und auf Griechisch. Griechisch konnten Gelehrte lesen, so ließen sich die anderen Zeilen vergleichen.',
      'Im Jahr 1822 fand Champollion heraus: Hieroglyphen sind nicht nur Bilder, sie stehen auch für Laute. Er verglich Königsnamen in ovalen Ringen, den Kartuschen, zum Beispiel „Ptolemaios“ und „Kleopatra“. Der Engländer Thomas Young hatte dafür wichtige Vorarbeit geleistet.',
    ],
    fact: 'Der Stein von Rosette liegt heute im Britischen Museum in London. Französische Soldaten hatten ihn gefunden, mussten ihn aber nach ihrer Niederlage 1801 den Engländern überlassen.',
    uncertain: 'Wie Champollion aussah, kennen wir von Bildern seiner Zeit; das Bild hier ist eine freie Zeichnung im Stil der 1820er-Jahre.',
    look: {
      props: ['feder'], skin: '#efc19b', age: 0.15, face: { w: 0.98 }, eyes: { col: '#3a2a1e' }, brow: { col: '#2a1c14' }, hair: { style: 'locken', col: '#2c1e16' },
      sideburns: { col: '#2c1e16', len: 0.5 }, dress: { style: 'frock', col: '#34463c', vest: '#d6b36e' }, bg: { id: 'hieroglyphen', c: ['#e2c48e', '#8a5a2a', '#b88a50'] },
    },
  },
  carter: {
    id: 'carter', dept: 'geschichte', name: 'Howard Carter', years: '1874 – 1939', role: 'Fand das Grab des Tutanchamun',
    paras: [
      'Howard Carter wurde in England geboren und kam als junger Mann nach Ägypten. Er konnte gut zeichnen und kopierte zuerst Wandbilder in Gräbern, später leitete er selbst Ausgrabungen.',
      'Viele Jahre suchte er im Tal der Könige nach dem Grab des jungen Königs Tutanchamun, bezahlt von Lord Carnarvon. Am 4. November 1922 wurden die ersten Stufen entdeckt, die zum Grab führten.',
      'Am 26. November 1922 machte Carter ein Loch in die verschlossene Tür und sah mit einer Kerze hinein. Gefragt, ob er etwas sehe, antwortete er: „Ja, wunderbare Dinge.“ Danach dauerte es rund zehn Jahre, bis alles vorsichtig geborgen und aufgeschrieben war.',
    ],
    fact: 'Im Grab lagen mehr als 5000 Gegenstände: Betten, Sandalen, Streitwagen, Schmuck und die berühmte Goldmaske.',
    uncertain: 'Das Bild ist eine freie Zeichnung im Stil der 1920er-Jahre. Von einem „Fluch des Pharao“ weiß die Wissenschaft nichts: Carter wurde 64 Jahre alt.',
    look: {
      skin: '#efbf98', age: 0.4, face: { w: 1.0, jaw: 0.2 }, eyes: { col: '#5a6a7a' }, brow: { col: '#4a3a2c' }, hair: { style: 'kurz', col: '#4a3a2c' },
      stache: { col: '#4a3a2c', droop: 0.03, w: 0.46, th: 0.7 }, hat: { style: 'homburg', col: '#6a5a46', band: '#2a2018' },
      dress: { style: 'anzug', col: '#8a7a5e', vest: '#5c5240', bow: '#8a2f2f' }, bg: { id: 'wueste', c: ['#f0c98a', '#d89a4a', '#b8703a'] },
    },
  },
  gutenberg: {
    id: 'gutenberg', dept: 'geschichte', name: 'Johannes Gutenberg', years: 'um 1400 – 1468', role: 'Entwickelte den Buchdruck mit Metalllettern in Europa',
    paras: [
      'Johannes Gutenberg lebte in Mainz und kannte sich als Goldschmied mit Metall aus. Um 1450 entwickelte er dort ein Verfahren, Bücher mit beweglichen Buchstaben aus Metall zu drucken.',
      'Er goss jeden Buchstaben einzeln als kleines Metallstück, die Letter. Daraus setzte man eine Seite zusammen, strich Farbe darauf und presste Papier dagegen. Danach konnte man die Lettern wieder auseinandernehmen und für die nächste Seite neu setzen.',
      'Vorher musste jedes Buch von Hand abgeschrieben werden, das dauerte lange und war teuer. Mit dem Buchdruck gab es bald viel mehr Bücher, und mehr Menschen kamen an sie heran.',
    ],
    fact: 'Die Buchstaben auf den Lettern sind spiegelverkehrt, damit sie im Abdruck richtig herum stehen. Von Gutenbergs berühmter Bibel mit 42 Zeilen je Seite wurden etwa 180 Stück gedruckt.',
    uncertain: 'Wie Gutenberg aussah, ist nicht überliefert: Alle Bilder von ihm sind viel später entstanden, auch dieses hier ist eine freie Zeichnung. Sein Geburtsjahr kennen wir nur ungefähr. In China und Korea gab es schon früher bewegliche Lettern; Gutenbergs Verfahren setzte sich in Europa durch.',
    look: {
      skin: '#e8b890', age: 0.55, face: { w: 1.0 }, eyes: { col: '#4a3a2a' }, brow: { col: '#6a5444' },
      hair: { style: 'wellig', col: '#6a5444', sdrop: 0.6, side: 1.22, flare: 0.1, top: -1.0, back: false }, beard: { style: 'gabel', col: '#6a5444' }, stache: { col: '#6a5444', droop: 0.08 },
      hat: { style: 'barett', col: '#3f4f7a', trim: '#2a2f4a' }, dress: { style: 'mittelalter', col: '#7a2f2a', fur: '#e8dfcc' }, bg: { id: 'lettern', c: ['#efe2c0', '#6a4a2a', '#9aa0a8'] },
    },
  },
  darwin: {
    id: 'darwin', dept: 'biologie', name: 'Charles Darwin', years: '1809 – 1882', role: 'Erklärte, wie sich Arten über lange Zeiten verändern',
    paras: [
      'Charles Darwin kam aus England. Mit 22 Jahren fuhr er auf dem Schiff HMS Beagle fast fünf Jahre lang um die Welt und sammelte Pflanzen, Tiere und Fossilien.',
      'Auf den Galápagos-Inseln fielen ihm Tiere auf, die sich von Insel zu Insel ein wenig unterschieden, zum Beispiel Vögel mit verschieden geformten Schnäbeln. Er fragte sich: Wie kommt das?',
      'Nach vielen Jahren Nachdenken schrieb er das Buch „Über die Entstehung der Arten“ (1859). Seine Idee: Lebewesen sind verschieden, und wer besser zur Umgebung passt, hat mehr Nachkommen. Über sehr lange Zeit verändern sich so die Arten. Auch der Forscher Alfred Russel Wallace war unabhängig auf diese Idee gekommen.',
    ],
    fact: 'Darwin liegt in der Westminster Abbey in London begraben, ganz in der Nähe von Isaac Newton.',
    uncertain: 'Dass die Finken ihm schon auf der Reise die Idee gaben, ist eine vereinfachte Geschichte: Erst nach der Reise erkannte ein Vogelkundler, wie nah sie verwandt sind. Das Bild ist eine freie Zeichnung.',
    look: {
      skin: '#ebb996', age: 0.9, face: { w: 1.04, h: 1.0, dome: 0.12, brow: 1 }, eyes: { col: '#4a3a2a', size: 0.95 }, brow: { col: '#a8a49c', thick: 1.7, arch: 0.6 },
      hair: { style: 'kranz', col: '#d8d4cc' }, beard: { style: 'voll', col: '#dedad2', len: 0.9, wid: 1.06, curl: 3, wl: 26, strands: 60 },
      dress: { style: 'victorian', col: '#2e2d32' }, bg: { id: 'galapagos', c: ['#cfe8e0', '#4a9a8a', '#e8c25a'] },
    },
  },
  linne: {
    id: 'linne', dept: 'biologie', name: 'Carl von Linné', years: '1707 – 1778', role: 'Führte die zweiteiligen Namen für Lebewesen ein',
    paras: [
      'Carl von Linné kam aus Schweden. Er wurde Arzt und Pflanzenforscher und lehrte in Uppsala. Schon als Kind liebte er Pflanzen: Sein Vater, ein Pfarrer, hatte einen Garten.',
      'Zu seiner Zeit hatten Pflanzen oft lange Namen, fast wie Beschreibungen. Linné gab jeder Art einen kurzen Namen aus zwei lateinischen Wörtern: erst die Gattung, dann die Art, zum Beispiel Rosa canina, die Hunds-Rose. So weiß man auf der ganzen Welt, welche Art gemeint ist.',
      'Er ordnete auch Tiere und Pflanzen in Gruppen. Selbst den Menschen nahm er auf und nannte ihn Homo sapiens, „der weise Mensch“.',
    ],
    fact: 'Eine kleine nordische Blume trägt seinen Namen: Linnaea borealis, das Moosglöckchen. Du siehst sie im Bild neben ihm.',
    uncertain: 'Das Bild ist eine freie Zeichnung. Perücke und Rock zeigen die Mode des 18. Jahrhunderts.',
    look: {
      skin: '#f0c8a4', age: 0.35, face: { w: 0.96 }, eyes: { col: '#4a5a6a' }, brow: { col: '#6a5a4a' }, hair: { style: 'allonge', col: '#e9e2d2' },
      dress: { style: 'schwedisch', col: '#2f5a7a', vest: '#efe2c0' }, bg: { id: 'kraeuter', c: ['#f1e9cf', '#5a9a5a', '#d88aa0'] },
    },
  },
  mendel: {
    id: 'mendel', dept: 'biologie', name: 'Gregor Mendel', years: '1822 – 1884', role: 'Entdeckte die Regeln der Vererbung',
    paras: [
      'Gregor Mendel wuchs auf einem Bauernhof im heutigen Tschechien auf. Er trat in das Augustinerkloster in Brünn ein, wurde Mönch und unterrichtete auch Naturwissenschaften.',
      'Im Klostergarten kreuzte er Erbsenpflanzen und zählte genau: Wie viele Nachkommen haben gelbe oder grüne Erbsen, runde oder runzelige? Acht Jahre lang untersuchte er so Tausende von Pflanzen.',
      'Dabei fand er feste Regeln. Kreuzt man eine Sorte, die immer gelbe Erbsen hat, mit einer, die immer grüne hat, sind alle Nachkommen gelb. In der nächsten Generation tauchen die grünen wieder auf, und zwar im Verhältnis von etwa drei gelben zu einer grünen Erbse.',
    ],
    fact: 'Mendels Arbeit blieb lange fast unbeachtet. Erst um 1900, mehr als 15 Jahre nach seinem Tod, haben Forscher seine Regeln wiederentdeckt.',
    uncertain: 'Das Bild ist eine freie Zeichnung. Die vier Erbsen oben zeigen das Verhältnis 3 zu 1. Das Wort „Gen“ gab es zu Mendels Zeit noch nicht.',
    look: {
      skin: '#efc3a0', age: 0.2, blush: 0.14, face: { w: 1.08, cheek: 1, jaw: 0.25 }, eyes: { col: '#5a4a3a', size: 0.95 }, brow: { col: '#4a3a2c', thick: 1.3 },
      hair: { style: 'kurz', col: '#5a4838', top: -1.12, hl: [[0.93, 0.0], [0.9, -0.42], [0.76, -0.66], [0.5, -0.8], [0.1, -0.84], [-0.3, -0.8], [-0.7, -0.66], [-0.9, -0.42], [-0.93, 0.0]] },
      dress: { style: 'habit', col: '#26242a' }, bg: { id: 'erbsen', c: ['#e6efc8', '#5aa05a', '#c9d86a'] },
    },
  },
  humboldt: {
    id: 'humboldt', dept: 'biologie', name: 'Alexander von Humboldt', years: '1769 – 1859', role: 'Forschungsreisender und Naturforscher',
    paras: [
      'Alexander von Humboldt stammte aus Berlin. Von 1799 bis 1804 reiste er mit dem Botaniker Aimé Bonpland durch Mittel- und Südamerika und maß, zeichnete und sammelte unterwegs alles Mögliche.',
      'Er erkannte, dass in der Natur alles zusammenhängt: Klima, Höhe, Pflanzen und Tiere. An einem Berg wie dem Chimborazo in Ecuador wachsen in jeder Höhenstufe andere Pflanzen. Das hielt er in einer berühmten Zeichnung fest.',
      'Er schrieb auch früh, dass der Mensch die Natur schädigen kann: Am Valenciasee in Venezuela sank der Wasserspiegel, weil rundherum der Wald abgeholzt wurde.',
    ],
    fact: 'Am Chimborazo stieg Humboldt 1802 sehr hoch hinauf, bis auf etwa 5900 Meter. Das war damals ein Höhenrekord, denn der Berg galt als höchster der Welt.',
    uncertain: 'Die Höhe, die Humboldt erreichte, wird in Quellen unterschiedlich angegeben (zwischen etwa 5600 und 5900 Metern). Das Bild ist eine freie Zeichnung.',
    look: {
      skin: '#f0c7a4', age: 0.7, face: { w: 0.98, jaw: 0.1 }, eyes: { col: '#5a6a7a' }, brow: { col: '#a09a90' },
      hair: { style: 'wellig', col: '#cfc9be', sdrop: -0.3, flare: 0.0, top: -1.34, bump: { amp: 5, wl: 34 }, back: false }, sideburns: { col: '#e4dfd4', len: 0.18, wid: 0.7 },
      dress: { style: 'frack', col: '#243a5a', vest: '#f1ead8', ribbon: '#a02a2a' }, bg: { id: 'tropen', c: ['#cfe6ea', '#3f8f5a', '#f2f0ea'] },
    },
  },
  merian: {
    id: 'merian', dept: 'biologie', name: 'Maria Sibylla Merian', years: '1647 – 1717', role: 'Erforschte und malte Raupen und Falter',
    paras: [
      'Maria Sibylla Merian wurde in Frankfurt am Main geboren. Schon als Mädchen sammelte sie Raupen und beobachtete, wie sie sich zu Faltern verwandeln. Malen lernte sie bei ihrem Stiefvater, einem Maler.',
      'Sie malte nicht nur Insekten, sondern ihre ganze Verwandlung: Ei, Raupe, Puppe und Falter, dazu die Pflanze, von der die Raupe frisst. So zeigte sie genau, was zusammengehört.',
      'Mit 52 Jahren reiste sie 1699 mit ihrer Tochter Dorothea nach Surinam in Südamerika, um dort Insekten zu erforschen. Eine solche Reise war für eine Frau damals sehr ungewöhnlich.',
    ],
    fact: 'Die Reise nach Surinam bezahlte Merian selbst, mit dem Verkauf ihrer Bilder. Ihr Buch über die Insekten von Surinam erschien 1705.',
    uncertain: 'Das Bild ist eine freie Zeichnung. Haube und Kragen zeigen die Mode des 17. Jahrhunderts. Die Falter und die Raupe sind nur Beispiele, keine Nachbildung ihrer Tafeln.',
    look: {
      skin: '#f1cba9', age: 0.5, female: true, face: { w: 0.98 }, eyes: { col: '#4a3a2a' }, brow: { col: '#7a6450' }, hair: { style: 'none', col: '#7a6450' },
      hat: { style: 'haube' }, dress: { style: 'barock', col: '#4a2a30' }, bg: { id: 'falter', c: ['#f3e6c4', '#6aaa5a', '#e8883a'] },
    },
  },
  anning: {
    id: 'anning', dept: 'biologie', name: 'Mary Anning', years: '1799 – 1847', role: 'Fossiliensammlerin aus Lyme Regis',
    paras: [
      'Mary Anning wuchs in Lyme Regis auf, einem Ort an der Küste im Süden Englands. Ihre Familie war arm. Sie sammelte mit ihrer Familie Fossilien an den Klippen und verkaufte sie an Besucher.',
      'Als Kind half sie, das Skelett einer Meeresechse auszugraben, eines Ichthyosauriers. Später fand sie unter anderem einen Plesiosaurier und Reste eines Flugsauriers.',
      'Berühmte Gelehrte kauften bei ihr Fossilien und lernten von ihr. In den Berichten wurde ihr Name aber oft nicht genannt, denn sie war eine Frau aus einfachen Verhältnissen. In die Geologische Gesellschaft durften Frauen damals nicht.',
    ],
    fact: 'Die Küste bei Lyme Regis heißt heute „Jurassic Coast“ und ist UNESCO-Welterbe. Dort findet man bis heute Ammoniten und andere Fossilien.',
    uncertain: 'Von Mary Anning gibt es nur wenige Bilder; das Bild hier ist eine freie Zeichnung. Den Schädel des ersten Ichthyosauriers fand wohl ihr Bruder Joseph, das Skelett grub Mary aus.',
    look: {
      props: ['hammer'], skin: '#eec3a0', age: 0.2, female: true, face: { w: 0.96, cheek: 0.5 }, eyes: { col: '#4a3a2a' }, brow: { col: '#5a4434' },
      hair: { style: 'kurz', col: '#5a4434', top: -0.95, side: 1.04, hl: [[0.93, 0.1], [0.92, -0.3], [0.7, -0.52], [0.34, -0.6], [0, -0.62], [-0.34, -0.6], [-0.7, -0.52], [-0.92, -0.3], [-0.93, 0.1]] },
      hat: { style: 'bonnet', col: '#d8c8a2', ribbon: '#a04a48' }, dress: { style: 'schlicht', col: '#4e5a60', shawl: '#e8dcc2' }, bg: { id: 'klippen', c: ['#c7d6da', '#6f8494', '#d8c8a2'] },
    },
  },
  franklin: {
    id: 'franklin', dept: 'biologie', name: 'Rosalind Franklin', years: '1920 – 1958', role: 'Machte Röntgenbilder der DNA',
    paras: [
      'Rosalind Franklin war Chemikerin und Physikerin aus London. Sie war Expertin dafür, mit Röntgenstrahlen die Anordnung von Teilchen sichtbar zu machen: Die Strahlen laufen durch eine Probe, und das Muster auf dem Film verrät, wie die Teilchen liegen.',
      'Mit ihrem Doktoranden Raymond Gosling machte sie 1952 in London die berühmte „Aufnahme 51“ von DNA, dem Stoff, in dem unsere Erbinformation steckt. Das X-förmige Muster zeigt: DNA ist schraubenförmig gebaut.',
      'Die Forscher Watson und Crick bauten 1953 in Cambridge ihr Modell der Doppelhelix. Sie hatten dabei Franklins Aufnahme und Messwerte gesehen, ohne dass sie davon wusste. Den Nobelpreis dafür bekamen 1962 Watson, Crick und Wilkins, denn Franklin war 1958 mit 37 Jahren gestorben.',
    ],
    fact: 'Für die Aufnahme 51 musste die DNA-Probe mehr als zwei Tage lang geröntgt werden.',
    uncertain: 'Wie viel Franklins Daten zum Modell beitrugen, wird bis heute besprochen. Sicher ist: Sie waren wichtig, und Franklin hat die Struktur der DNA auch selbst untersucht. Das Bild ist eine freie Zeichnung, das Muster im Hintergrund nur angedeutet.',
    look: {
      props: ['mikroskop'], skin: '#f1c9a8', age: 0.2, female: true, face: { w: 0.96, chin: 0.1 }, eyes: { col: '#3a2a1e', size: 1.05 }, brow: { col: '#2a1c14', thick: 1.0 },
      hair: { style: 'kurz', col: '#2a1c14', side: 1.1, sdrop: 0.3, flare: 0.04 }, dress: { style: 'kittel', col: '#f2efe8', blouse: '#8fb0c8' }, bg: { id: 'roentgen', c: ['#1d2a4a', '#e8e2c8', '#5a8ac8'] },
    },
  },
  lavoisier: {
    id: 'lavoisier', dept: 'chemie', name: 'Antoine Lavoisier', years: '1743 – 1794', role: 'Begründer der modernen Chemie',
    paras: [
      'Antoine Lavoisier lebte in Paris und wog bei seinen Versuchen alles sehr genau. So zeigte er: Bei einer chemischen Reaktion geht nichts verloren und es entsteht nichts aus dem Nichts, die Gesamtmasse bleibt gleich.',
      'Er erkannte, dass beim Verbrennen ein Teil der Luft mit dem brennenden Stoff reagiert, und nannte ihn „Oxygène“, auf Deutsch „Sauerstoff“. Das Gas hatten schon Carl Wilhelm Scheele und Joseph Priestley entdeckt, aber Lavoisier verstand, was es beim Verbrennen tut.',
      'Er zeigte auch, dass Wasser kein Element ist, sondern aus zwei Gasen besteht, Wasserstoff und Sauerstoff. 1789 schrieb er ein Lehrbuch mit einer Liste der damals bekannten Elemente. 1794 wurde er in der Französischen Revolution hingerichtet, weil er früher als Steuerpächter gearbeitet hatte.',
    ],
    fact: 'Lavoisiers Frau Marie-Anne half ihm im Labor: Sie zeichnete seine Versuche, führte Protokoll und übersetzte englische Fachtexte für ihn.',
    uncertain: 'Dass die Gesamtmasse bei Reaktionen gleich bleibt, hatten schon andere vermutet; Lavoisier zeigte es überzeugend durch genaues Wiegen. In seiner Liste der Elemente standen auch Licht und Wärme. Das Bild ist eine freie Zeichnung.',
    look: {
      skin: '#f0c8a6', age: 0.3, face: { w: 0.96 }, eyes: { col: '#4a5a6a' }, brow: { col: '#7a7468' }, hair: { style: 'rollen', col: '#ddd6c6' },
      dress: { style: 'rokoko', col: '#6b2f3a', vest: '#e6d3a4' }, bg: { id: 'waage', c: ['#f0e2c0', '#b88a4a', '#9ac0cc'] },
    },
  },
  mendelejew: {
    id: 'mendelejew', dept: 'chemie', name: 'Dmitri Mendelejew', years: '1834 – 1907', role: 'Ordnete die Elemente im Periodensystem',
    paras: [
      'Dmitri Mendelejew wurde in Sibirien geboren und später Professor für Chemie in Sankt Petersburg. Für sein Lehrbuch wollte er die damals bekannten 63 Elemente ordnen.',
      'Er sortierte sie nach ihrer Atommasse und stellte fest: Bestimmte Eigenschaften kehren regelmäßig wieder. 1869 veröffentlichte er daraus sein Periodensystem. Etwa zur gleichen Zeit fand auch der Deutsche Lothar Meyer ein ähnliches System.',
      'Das Besondere: Mendelejew ließ Lücken frei. Er sagte voraus, dass es noch unbekannte Elemente gibt, und beschrieb sogar ihre Eigenschaften. Als Gallium (1875), Scandium (1879) und Germanium (1886) entdeckt wurden, passte vieles genau.',
    ],
    fact: 'Nach Mendelejew ist ein Element benannt: Mendelevium (Md) mit der Ordnungszahl 101.',
    uncertain: 'Dass ihm das System im Traum eingefallen sei, wird erzählt, ist aber nicht belegt. Das Periodensystem im Bild hat die heutige Form, nicht die von Mendelejews erster Tabelle; die gelben Fragezeichen zeigen drei seiner Lücken (Sc, Ga, Ge). Das Bild ist eine freie Zeichnung.',
    look: {
      skin: '#ecc0a0', age: 0.75, face: { w: 1.02 }, eyes: { col: '#6a8aa8', size: 1.0 }, brow: { col: '#b8b2a6', thick: 1.7 }, hair: { style: 'lang', col: '#cbc5b9' },
      beard: { style: 'voll', col: '#cfc9bd', len: 0.6, wid: 1.15, curl: 5, wl: 24, strands: 60 }, dress: { style: 'russisch', col: '#3a3a40' }, bg: { id: 'periodensystem', c: ['#efe6d0', '#3a6a9a', '#e8b83a'] },
    },
  },
  curie: {
    id: 'curie', dept: 'chemie', name: 'Marie Curie', years: '1867 – 1934', role: 'Erforschte die Radioaktivität',
    paras: [
      'Marie Curie wurde in Warschau als Maria Skłodowska geboren. Frauen durften dort nicht studieren, darum ging sie 1891 nach Paris. Später heiratete sie den Physiker Pierre Curie.',
      'Henri Becquerel hatte bemerkt, dass Uran unsichtbare Strahlen aussendet. Marie Curie untersuchte diese Strahlung genauer und nannte sie „Radioaktivität“. Aus Tonnen von Pechblende, einem Uranerz, gewann sie mit Pierre winzige Mengen von zwei neuen Elementen: Polonium (nach ihrer Heimat Polen) und Radium (von lateinisch radius, „Strahl“).',
      'Sie bekam zwei Nobelpreise: 1903 für Physik, gemeinsam mit Pierre Curie und Becquerel, und 1911 für Chemie. Damals kannte man die Gefahren der Strahlung noch nicht. Marie Curie starb 1934 an einer Erkrankung, die wohl von der Strahlung kam.',
    ],
    fact: 'Marie Curies Laborbücher strahlen noch heute und werden in Kisten mit Bleiauskleidung aufbewahrt.',
    uncertain: 'Das Bild ist eine freie Zeichnung. Die Kärtchen zeigen Radium (Ra, Ordnungszahl 88) und Polonium (Po, 84).',
    look: {
      props: ['roehrchen'], skin: '#f2cdb0', age: 0.5, female: true, face: { w: 0.94, chin: 0.15 }, eyes: { col: '#6a6a70', size: 1.0 }, brow: { col: '#6a5a50', thick: 0.9 },
      hair: { style: 'knoten', col: '#8a7a6a' }, dress: { style: 'trauer', col: '#2c2a2e' }, bg: { id: 'strahlen', c: ['#10343a', '#6ae8a0', '#e8f8d0'] },
    },
  },
  liebig: {
    id: 'liebig', dept: 'chemie', name: 'Justus von Liebig', years: '1803 – 1873', role: 'Gründete in Gießen ein berühmtes Lehrlabor',
    paras: [
      'Justus Liebig wuchs in Darmstadt auf, wo sein Vater mit Farben und Chemikalien handelte. Schon als Junge probierte er Versuche aus. Mit 21 Jahren wurde er Professor in Gießen.',
      'Dort richtete er ein Labor ein, in dem die Studenten selbst experimentieren, wiegen und analysieren mussten. Das war damals neu. Aus vielen Ländern kamen junge Leute, um bei ihm zu lernen.',
      'Liebig erforschte auch, was Pflanzen zum Wachsen brauchen: zum Beispiel Stickstoff, Phosphor und Kalium aus dem Boden. Daraus entstanden die Mineraldünger, mit denen die Ernten größer wurden.',
    ],
    fact: 'Der Liebig-Kühler heißt nach ihm, erfunden hat er ihn aber nicht: Liebig hat dieses Glasgerät nur bekannt gemacht.',
    uncertain: 'Das Bild ist eine freie Zeichnung. Liebig war später Professor in München; Kolben und Kühler im Bild stehen für sein Labor.',
    look: {
      skin: '#eec1a0', age: 0.6, face: { w: 1.0 }, eyes: { col: '#4a5a6a' }, brow: { col: '#6a645a', thick: 1.4 },
      hair: { style: 'wellig', col: '#6f685e', sdrop: -0.3, flare: 0.0, top: -1.34, bump: { amp: 5, wl: 34 }, back: false, hl: [[0.93, -0.2], [0.9, -0.5], [0.7, -0.72], [0.4, -0.84], [0, -0.82], [-0.4, -0.84], [-0.7, -0.72], [-0.9, -0.5], [-0.93, -0.2]] },
      sideburns: { col: '#b8b2a6', len: 0.9, wid: 1.5, curl: 3.5 }, dress: { style: 'arbeitskittel', col: '#6f8494' }, bg: { id: 'labor', c: ['#e2eadc', '#9ac0cc', '#e8883a'] },
    },
  },
  bunsen: {
    id: 'bunsen', dept: 'chemie', name: 'Robert Bunsen', years: '1811 – 1899', role: 'Spektralanalyse und Bunsenbrenner',
    paras: [
      'Robert Bunsen war Chemiker und lehrte lange an der Universität Heidelberg. Er mochte Versuche, bei denen man genau hinsehen muss.',
      'Für seine Versuche brauchte er eine heiße Flamme, die kaum leuchtet. Um 1855 entstand mit seinem Heidelberger Mechaniker Peter Desaga der Brenner, der bis heute „Bunsenbrenner“ heißt: Gas strömt durch ein Rohr, unten wird Luft zugemischt.',
      'In der fast farblosen Flamme sieht man, wie Stoffe sie färben: Natrium gelb, Kalium violett, Kupfer grün. Mit dem Physiker Gustav Kirchhoff zerlegte er das Licht solcher Flammen in einzelne Linien. Jedes Element hat seine eigenen Linien. So fanden sie 1860 und 1861 die neuen Elemente Caesium und Rubidium.',
    ],
    fact: 'Gibt man eine Prise Kochsalz in eine Brennerflamme, leuchtet sie gelb. Das ist das Natrium im Salz. (Probiere das nur mit deiner Lehrerin oder deinem Lehrer aus.)',
    uncertain: 'Ähnliche Gasbrenner gab es schon vor Bunsen, etwa von Michael Faraday; der Brenner mit regelbarer Luftzufuhr wurde mit Desaga weiterentwickelt. Das Bild ist eine freie Zeichnung.',
    look: {
      props: ['brenner'], skin: '#f0c4a2', age: 0.75, face: { w: 1.02, dome: 0.1 }, eyes: { col: '#5a6a7a' }, brow: { col: '#bfb9ae', thick: 1.3 }, hair: { style: 'kranz', col: '#d4cfc4' },
      dress: { style: 'gelehrtenrock', col: '#3b3430', vest: '#7a7488' }, bg: { id: 'flamme', c: ['#2c3a4a', '#e8883a', '#f2e45a'] },
    },
  },
  hodgkin: {
    id: 'hodgkin', dept: 'chemie', name: 'Dorothy Hodgkin', years: '1910 – 1994', role: 'Machte mit Röntgenstrahlen den Bau von Molekülen sichtbar',
    paras: [
      'Dorothy Hodgkin wurde in Kairo geboren. Ihre Eltern waren Engländer, die in Ägypten arbeiteten, und sie interessierte sich schon als Kind für Kristalle.',
      'Hodgkin schickte Röntgenstrahlen durch Kristalle. Aus dem Muster aus vielen Punkten rechnete sie aus, wo die Atome sitzen. So zeigte sie, wie Moleküle gebaut sind, zum Beispiel Penicillin (1945), Vitamin B12 (1956) und später Insulin (1969).',
      'Dafür bekam sie 1964 den Nobelpreis für Chemie. Sie war die dritte Frau, die ihn erhielt.',
    ],
    fact: 'Für die Struktur des Insulins brauchte Hodgkin 35 Jahre: 1934 machte sie die ersten Röntgenaufnahmen, 1969 war das Ergebnis fertig.',
    uncertain: 'Das Bild ist eine freie Zeichnung. Das Kugel-Stab-Modell im Hintergrund zeigt nur das Prinzip eines Kristalls (Atome in regelmäßiger Anordnung), kein bestimmtes Molekül.',
    look: {
      skin: '#f2cfb4', age: 0.6, female: true, face: { w: 0.96 }, eyes: { col: '#5a6a7a' }, brow: { col: '#a09a90', thick: 0.9 }, hair: { style: 'kurz', col: '#c4bfb4', side: 1.1, sdrop: 0.25 },
      glasses: 'round', dress: { style: 'strick', col: '#5b8a8a', blouse: '#f1e4cc' }, bg: { id: 'kristall', c: ['#e2e0f0', '#7a6ab8', '#e8a83a'] },
    },
  },
};
export const PERSON_IDS = Object.keys(PERSONS);
