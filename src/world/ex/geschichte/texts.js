// Kartentexte für den Raum Geschichte (Klasse 5/6, Du-Ansprache). Fachlich vorsichtig: Unsicheres steht in `src`.
// Quellen für Ägypten: Das große Ägypten-Popup-Buch (facts.md, Karten tutmaske, rosetta, papyrusrolle, doppelkrone, cheops).
const T = { kind: 'info', tag: 'Geschichte', dept: 'geschichte' };

export const EXHIBITS = {
  maske: {
    ...T, title: 'Goldmaske des Tutanchamun', sub: 'Grab KV62 · um 1323 v. Chr.',
    paras: [
      'Diese Maske lag auf dem Gesicht des jungen Pharaos Tutanchamun. Sie ist aus Gold und mit blauem Glas und Edelsteinen verziert.',
      'Auf der Stirn sitzen ein Geier und eine Kobra. Sie sind die Schutzgöttinnen von Oberägypten und Unterägypten.',
      'Der Forscher Howard Carter fand das Grab 1922 im Tal der Könige.',
    ],
    fact: 'Die Maske wiegt über 10 Kilogramm. Tutanchamun selbst wurde nur etwa 18 bis 19 Jahre alt.',
    src: 'Das hier ist ein Nachbau als Papierschnitt, das Original steht in Ägypten. Woran Tutanchamun starb, ist nicht endgültig geklärt.',
    label: 'Goldmaske des Tutanchamun',
  },
  rosette: {
    ...T, title: 'Der Stein von Rosette', sub: 'Gefunden 1799 · heute im Britischen Museum, London',
    paras: [
      'Auf diesem Stein steht derselbe Text dreimal: oben in Hieroglyphen, in der Mitte in Demotisch (einer ägyptischen Schreibschrift) und unten auf Griechisch.',
      'Griechisch konnten Forscher lesen. So half der Stein, die Hieroglyphen zu knacken. 1822 gelang das Jean-François Champollion.',
      'Auf dem Stein steht ein Erlass des Königs Ptolemaios V. aus dem Jahr 196 v. Chr.',
    ],
    fact: 'Der Stein ist oben abgebrochen. Vom Hieroglyphen-Text ist deshalb nur ein Teil erhalten.',
    src: 'Nachbau als Papierschnitt; die Schrift ist nur Zierde, bis auf den Namen Ptolemaios in der Kartusche. Ägypten wünscht sich den Stein zurück, darüber wird gestritten.',
    label: 'Stein von Rosette',
  },
  papyrus: {
    ...T, title: 'Die Papyrusrolle', sub: 'Das Papier der alten Ägypter',
    paras: [
      'Papyrus wächst im Sumpf am Nil. Aus dem Mark der Pflanze schnitt man dünne Streifen, legte sie kreuzweise übereinander und presste sie zu einem Blatt.',
      'Auf Papyrusrollen schrieb man Briefe, Geschichten und Listen. Manche sind über 3000 Jahre alt und noch lesbar.',
    ],
    fact: 'Unser Wort „Papier“ kommt von „Papyrus“.',
    src: 'Nachbau als Papierschnitt. Die Zeichen sind nur Zierde.',
    label: 'Papyrusrolle',
  },
  krone: {
    ...T, title: 'Die Doppelkrone (Pschent)', sub: 'Das Zeichen für ganz Ägypten',
    paras: [
      'Die Doppelkrone besteht aus zwei Kronen: der roten Krone von Unterägypten im Norden und der weißen Krone von Oberägypten im Süden. Die weiße steckt in der roten.',
      'Wer sie trug, war „Herr der Beiden Länder“. Vorn sitzt eine Kobra, die den König beschützen soll.',
    ],
    fact: 'Die rote Krone hat vorn eine kleine Spirale, wie ein Fühler.',
    src: 'Nachbau als Papierschnitt. Wie die Kronen genau aussahen, kennen wir vor allem von Bildern und Statuen.',
    label: 'Doppelkrone (Pschent)',
  },
  pyramide: {
    ...T, title: 'Modell der Cheops-Pyramide', sub: 'Aufgeschnitten: der Blick ins Innere',
    paras: [
      'Die Cheops-Pyramide war ursprünglich 146,6 Meter hoch und besteht aus rund 2,3 Millionen Steinblöcken. Gebaut wurde sie um 2600 v. Chr., in etwa 26 Jahren.',
      'Innen gibt es Gänge, drei Kammern und die Große Galerie. Am Modell: rot = Königskammer, blau = Königinnenkammer, gold = Große Galerie, braun = Gänge, türkis = schmale Schächte, violett = Kammer unter der Erde.',
    ],
    fact: 'Gebaut haben die Pyramide bezahlte Arbeiter, keine Sklaven. Ihre Siedlung hat man gefunden.',
    src: 'Gänge und Kammern sind im Modell viel dicker gezeichnet als in Wirklichkeit. Zahl der Blöcke und Bauzeit sind Schätzungen; wie man die Blöcke hinaufbrachte, ist nicht sicher geklärt. Der Name „Königinnenkammer“ ist alt; eine Königin lag dort vermutlich nicht.',
    label: 'Modell der Cheops-Pyramide',
  },
};

export const MAP_CARD = {
  ...T, title: 'Die Weltkarte', sub: 'Wo die Geschichte spielte',
  paras: ['Hier siehst du die Erde als flache Karte. Die roten Nadeln zeigen Orte, an denen Geschichte geschrieben wurde. Tippe auf eine Nadel, dann erfährst du mehr.'],
  fact: 'Auf Karten wie dieser sehen Länder nahe am Nordpol viel größer aus, als sie sind. Grönland ist zum Beispiel nur etwa ein Vierzehntel so groß wie Afrika.',
  src: 'Küstenlinien stark vereinfacht und von Hand stilisiert, keine genaue Karte. Grönland: etwa 2,2 Mio. km², Afrika: etwa 30 Mio. km².',
};

export const PIN_CARDS = {
  aegypten: {
    ...T, title: 'Ägypten am Nil', sub: 'Das Land der Pharaonen',
    paras: ['Ägypten liegt in Nordostafrika, mitten in der Wüste. Fast alle Menschen wohnten am Nil, denn nur dort wuchsen Felder.', 'Bei Gizeh stehen die großen Pyramiden. Die Cheops-Pyramide wurde um 2600 v. Chr. gebaut.'],
    fact: 'Der Nil gehört mit über 6000 Kilometern zu den längsten Flüssen der Erde.',
    src: 'Die Länge des Nils wird je nach Messung etwas unterschiedlich angegeben.',
  },
  zweistromland: {
    ...T, title: 'Das Zweistromland', sub: 'Mesopotamien zwischen Euphrat und Tigris',
    paras: ['„Mesopotamien“ heißt auf Griechisch „Land zwischen den Strömen“. Dort entstanden vor mehr als 5000 Jahren die ersten Städte.', 'Die Menschen schrieben mit einem Schilfgriffel Keile in feuchte Tontafeln. Diese Schrift heißt Keilschrift.'],
    fact: 'Keilschrift und Hieroglyphen gehören zu den ältesten Schriften der Welt.',
    src: 'Die ersten Schriftzeichen stammen aus der Zeit um 3300 bis 3000 v. Chr.; genaue Jahre sind Schätzungen.',
  },
  athen: {
    ...T, title: 'Athen', sub: 'Die Stadt der ersten Demokratie',
    paras: ['Um 500 v. Chr. durften in Athen die Bürger selbst über Gesetze abstimmen. Das Wort „Demokratie“ heißt „Herrschaft des Volkes“.', 'Mitmachen durften damals aber nur freie Männer. Frauen und Sklaven durften nicht abstimmen.'],
    fact: 'Auf dem Hügel Akropolis in Athen stehen noch heute Tempel, die über 2400 Jahre alt sind.',
    src: 'Die Reformen, die man als Beginn der Demokratie sieht, stammen aus den Jahren 508/507 v. Chr.',
  },
  rom: {
    ...T, title: 'Rom', sub: 'Hauptstadt des Römischen Reiches',
    paras: ['Nach der Sage wurde Rom 753 v. Chr. von den Zwillingen Romulus und Remus gegründet. Eine Wölfin soll sie gesäugt haben.', 'Später gehörten die Länder rund um das Mittelmeer zum Römischen Reich. Auch Ägypten wurde 30 v. Chr. eine römische Provinz.'],
    fact: 'Römische Straßen, Brücken und Wasserleitungen stehen zum Teil bis heute.',
    src: 'Das Gründungsjahr 753 v. Chr. kommt aus der Sage. Archäologen datieren die ersten Siedlungen etwas anders.',
  },
  mainz: {
    ...T, title: 'Mainz', sub: 'Die Stadt Johannes Gutenbergs',
    paras: ['Um 1450 erfand Johannes Gutenberg in Mainz den Buchdruck mit beweglichen Buchstaben aus Metall.', 'Vorher schrieben Mönche Bücher mit der Hand ab. Mit dem Druck wurden Bücher viel billiger, und mehr Menschen konnten lesen lernen.'],
    fact: 'Gutenbergs berühmteste Arbeit ist die Bibel, gedruckt um 1452 bis 1455.',
    src: 'Bewegliche Lettern gab es schon früher in Ostasien. Gutenbergs Druckerpresse mit Metall-Lettern war für Europa neu.',
  },
  xian: {
    ...T, title: 'Xi’an in China', sub: 'Die Terrakotta-Armee',
    paras: ['Chinas erster Kaiser, Qin Shihuangdi, ließ sich vor über 2200 Jahren ein riesiges Grab bauen. Darin stehen tausende Soldaten aus Ton.', 'Bauern fanden sie 1974, als sie einen Brunnen gruben. Jeder Soldat hat ein eigenes Gesicht.'],
    fact: 'Man schätzt, dass es über 8000 Tonsoldaten gibt.',
    src: 'Die Zahl der Figuren ist eine Schätzung, nicht alle sind ausgegraben.',
  },
  machu: {
    ...T, title: 'Machu Picchu in Peru', sub: 'Eine Inka-Stadt in den Wolken',
    paras: ['Die Inka bauten Machu Picchu um 1450 hoch in den Anden, auf etwa 2400 Metern Höhe. Die Steine sind so genau aufeinander gepasst, dass man kaum eine Fuge sieht.', 'Die Inka hatten keine Schrift wie wir. Zum Zählen und Merken benutzten sie Schnüre mit Knoten.'],
    fact: 'Machu Picchu blieb lange vor den Spaniern verborgen. Die Welt erfuhr erst im 20. Jahrhundert davon.',
    src: 'Das Baujahr ist geschätzt (um 1450). Die Bewohner kannten den Ort immer; für die Forschung wurde er 1911 bekannt.',
  },
  bahamas: {
    ...T, title: 'Die Bahamas', sub: 'Kolumbus 1492',
    paras: ['Am 12. Oktober 1492 erreichte Christoph Kolumbus mit drei Schiffen eine Insel in der Karibik. Er wollte eigentlich einen Seeweg nach Indien finden.', 'Für die Europäer war Amerika neu. Für die Menschen, die dort schon lange lebten, begann aber eine schwere Zeit.'],
    fact: 'Kolumbus’ Schiffe hießen Santa María, Pinta und Niña.',
    src: 'Welche Insel es genau war, ist unter Forschern umstritten (meist wird San Salvador auf den Bahamas genannt).',
  },
};

export const EPOCHS = {
  urgeschichte: {
    ...T, title: 'Urgeschichte', sub: 'Die Zeit vor der Schrift',
    paras: ['Aus dieser Zeit gibt es noch keine Schrift. Wir wissen nur etwas über sie, weil Forscher Knochen, Werkzeuge und Höhlenbilder untersuchen.', 'Die Menschen zogen zuerst als Jäger und Sammler umher. Später wurden sie sesshaft, bauten Felder an und hielten Tiere.'],
    fact: 'Manche Höhlenbilder sind über 40 000 Jahre alt.',
    src: 'Wann die Steinzeit endet, ist von Gegend zu Gegend verschieden.',
  },
  altertum: {
    ...T, title: 'Altertum', sub: 'Etwa 3000 v. Chr. bis 476 n. Chr.',
    paras: ['Im Altertum entstehen die ersten Schriften, Städte und Reiche: Ägypten am Nil, die Stadtstaaten der Griechen und später das Römische Reich.', 'Aus dieser Zeit stammen die Pyramiden, der Stein von Rosette und die ersten Demokratien.'],
    fact: 'Die Cheops-Pyramide ist über 4500 Jahre alt.',
    src: 'Die Epochen sind Einteilungen der Geschichtsforscher, keine festen Grenzen.',
  },
  mittelalter: {
    ...T, title: 'Mittelalter', sub: 'Etwa 500 bis etwa 1500 n. Chr.',
    paras: ['Das Mittelalter dauerte rund 1000 Jahre. Es gab Burgen und Ritter, Klöster und wachsende Städte.', 'Bücher wurden damals mit der Hand abgeschrieben, oft von Mönchen.'],
    fact: 'Das Wort „Mittelalter“ erfanden spätere Gelehrte: Sie sahen die Zeit „in der Mitte“ zwischen der Antike und ihrer eigenen.',
    src: 'Anfang und Ende des Mittelalters werden je nach Land und Forscher unterschiedlich angesetzt.',
  },
  neuzeit: {
    ...T, title: 'Neuzeit', sub: 'Seit etwa 1500 n. Chr.',
    paras: ['Um 1500 verändern neue Erfindungen, Entdeckungsreisen und neue Ideen die Welt: der Buchdruck, die Fahrten nach Amerika, später Dampfmaschine, Strom und Raumfahrt.'],
    fact: 'Schon vor dem Jahr 1500 waren in Europa Millionen gedruckter Bücher im Umlauf.',
    src: 'Oft wird 1492 (Kolumbus) als Beginn genannt; manche Forscher wählen auch andere Jahre.',
  },
};

// Zeituhr: zehn Meilensteine, gleichmäßig auf dem Ring verteilt (nicht maßstabsgetreu)
export const MILESTONES = [
  { year: '3000', era: 'v. Chr.', icon: 'papyrus', epoch: 'altertum', text: 'Um 3000 v. Chr.: Die ersten Schriften entstehen, in Ägypten die Hieroglyphen. Auch das Reich der Pharaonen beginnt.' },
  { year: '2600', era: 'v. Chr.', icon: 'pyramide', epoch: 'altertum', text: 'Um 2600 v. Chr.: Die Ägypter bauen für König Cheops die größte Pyramide von Gizeh.' },
  { year: '508', era: 'v. Chr.', icon: 'tempel', epoch: 'altertum', text: '508 v. Chr.: In Athen beginnt eine der ersten Demokratien. Die Bürger stimmen selbst über Gesetze ab.' },
  { year: '30', era: 'v. Chr.', icon: 'kobra', epoch: 'altertum', text: '30 v. Chr.: Kleopatra, die letzte Königin Ägyptens, stirbt. Ägypten wird eine römische Provinz.' },
  { year: '476', era: 'n. Chr.', icon: 'lorbeer', epoch: 'altertum', text: '476: Der letzte Kaiser im Westen des Römischen Reiches wird abgesetzt. Viele Forscher sehen darin das Ende der Antike. Der Ostteil des Reiches bestand noch fast 1000 Jahre weiter.' },
  { year: '800', era: 'n. Chr.', icon: 'krone', epoch: 'mittelalter', text: '800: Karl der Große wird in Rom zum Kaiser gekrönt.' },
  { year: '1450', era: 'n. Chr.', icon: 'druck', epoch: 'mittelalter', text: 'Um 1450: Johannes Gutenberg erfindet in Mainz den Buchdruck mit beweglichen Metall-Buchstaben. Bücher werden viel billiger.' },
  { year: '1492', era: 'n. Chr.', icon: 'schiff', epoch: 'neuzeit', text: '1492: Christoph Kolumbus erreicht Inseln in der Karibik. Für die Europäer beginnt das Zeitalter der Entdeckungen, für die Menschen in Amerika eine schwere Zeit.' },
  { year: '1822', era: 'n. Chr.', icon: 'kartusche', epoch: 'neuzeit', text: '1822: Jean-François Champollion entziffert die Hieroglyphen. Der Stein von Rosette hat ihm dabei geholfen.' },
  { year: '1969', era: 'n. Chr.', icon: 'mond', epoch: 'neuzeit', text: '1969: Zum ersten Mal landen Menschen auf dem Mond (Apollo 11, 20. Juli): Neil Armstrong und Buzz Aldrin.' },
];
export const CLOCK_CARD = {
  ...T, title: 'Die Zeituhr', sub: 'Zehn Meilensteine von 3000 v. Chr. bis heute',
  paras: MILESTONES.map((m) => m.text),
  fact: 'Kleopatra lebte zeitlich näher an der Mondlandung als am Bau der Cheops-Pyramide.',
  src: 'Die Abstände auf der Uhr sind nicht maßstabsgetreu. Jahreszahlen mit „um“ sind gerundet. In der Mitte tickt die echte Uhrzeit.',
};

export const FURNITURE = {
  globus: {
    ...T, title: 'Der Globus', sub: 'Die Erde als Kugel',
    paras: ['Ein Globus zeigt die Erde ohne Verzerrung: Länder und Meere haben ihre richtige Form. Auf flachen Karten geht das nicht.', 'Die Erdachse ist ein bisschen schief, um etwa 23,4 Grad. Deshalb gibt es bei uns Sommer und Winter.'],
    fact: 'Der älteste erhaltene Globus der Welt stammt von Martin Behaim aus Nürnberg, von 1492. Amerika fehlt darauf noch.',
    src: 'Die Karte auf diesem Globus ist stark vereinfacht.',
  },
  tisch: {
    ...T, title: 'Der Kartentisch', sub: 'Zirkel, Lineal und Lupe',
    paras: ['Früher zeichneten Kartenmacher ihre Karten von Hand. Mit dem Zirkel und dem Lineal maß man Strecken, mit der Lupe prüfte man kleine Einzelheiten.', 'Auf dem Tisch liegt eine Karte vom Mittelmeer mit dem Nil.'],
    fact: 'Der berühmte Kartenmacher Gerhard Mercator lebte und arbeitete viele Jahre in Duisburg. Seine Weltkarte von 1569 benutzten Seeleute.',
    src: '',
  },
  presse: {
    ...T, title: 'Die Druckerpresse', sub: 'Gutenbergs Erfindung, um 1450',
    paras: ['Gutenberg goss einzelne Buchstaben aus Metall, die Lettern. Man setzte sie zu Zeilen, strich Farbe darauf und presste ein Blatt Papier dagegen.', 'Mit denselben Lettern konnte man viele Seiten drucken, ohne alles neu abzuschreiben.'],
    fact: 'Gutenbergs berühmte Bibel entstand um 1452 bis 1455 in Mainz.',
    src: 'Vereinfachtes Modell. Bewegliche Lettern gab es schon früher in Ostasien.',
  },
};
