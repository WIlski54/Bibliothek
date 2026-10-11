// Texte von Archimedes. Du-Ansprache, kurz, witzig-klug; Fakten geprüft, Überliefertes ist als „soll“ / „angeblich“ gekennzeichnet.
// Namensgeber: Archimedes von Syrakus (um 287 bis 212 v. Chr.), Gelehrter aus Syrakus auf Sizilien; Auftrieb, Hebel, Wasserschnecke.
export const TIPS = {
  foyer: 'Miau! Ich bin Archimedes. Tippe auf Türen, Regale und Bilder, ich zeige dir alles.',
  geschichte: 'Hier wohnt die Geschichte: Tippe auf Bilder, Vitrinen und Regale, hinter jedem Stück steckt eine Geschichte.',
  biologie: 'Biologie! Tippe auf Tiere und Pflanzen, dann erfährst du, wie sie leben. Ich bin übrigens auch ein Säugetier.',
  chemie: 'Tippe auf das Periodensystem: Jedes Feld verrät dir sein Element. Heureka, so macht Chemie Spaß!',
};

// Sprüche beim Antippen, je Raum 5 bis 6, rotierend. „Heureka“-Sprüche zeigen eine Glühbirne.
export const LINES = {
  foyer: [
    'Miau! Das ist mein Reich. Ich bin hier der Hausherr, du bist mein Gast.',
    'Heureka! So soll der Gelehrte Archimedes gerufen haben, wenn ihm etwas Kluges einfiel. Mir fällt dauernd etwas Kluges ein.',
    'Drei Türen, drei Fächer: Geschichte, Biologie und Chemie. Such dir eine aus, ich laufe vor!',
    'Mein Lieblingsplatz ist der Lesetisch in der Mitte. Dort schlafe ich besonders klug.',
    'Siehst du das Bild von mir neben der Biologie-Tür? Ich finde, es trifft mich gut.',
    'Die Neuzugänge liegen in der Vitrine. Neues Papier riecht am besten, finde ich.',
  ],
  geschichte: [
    'Im alten Ägypten waren Katzen hoch angesehen. Das ist die einzige Zeit, in der ich gern gelebt hätte.',
    'Mein Namensgeber Archimedes lebte vor über 2000 Jahren in Syrakus auf Sizilien. Ein Gelehrter, kein Kater.',
    'Wer Geschichte kennt, versteht, warum heute vieles so ist, wie es ist. Nur warum mein Napf zu früh leer ist, erklärt sie nicht.',
    'Quellen sind wie Mäusespuren: Man muss sie lesen können, sonst glaubt man jedes Märchen.',
    'Tippe auf Bilder und Vitrinen: Hinter jedem Stück steckt eine Geschichte.',
    'Unsicheres steht auf den Karten dabei. Gute Geschichte sagt auch, was man nicht sicher weiß.',
  ],
  biologie: [
    'Ich bin selbst ein Fall für die Biologie: ein Säugetier und ein Fleischfresser, dazu ein Genie auf Samtpfoten.',
    'Katzen schlafen bis zu 16 Stunden am Tag. Das ist nicht faul, das ist Forschung.',
    'Meine Schnurrhaare sind Fühler: Damit merke ich, ob ich durch eine Lücke passe.',
    'Im Halbdunkel sehe ich viel besser als du. Eine spiegelnde Schicht im Auge verstärkt das Restlicht.',
    'Pflanzen machen aus Licht, Wasser und Luft ihr Essen. Das heißt Fotosynthese. Ich nenne es Neid.',
    'Alle Lebewesen bestehen aus Zellen: Pflanzen, Pilze, Bakterien, du und ich.',
  ],
  chemie: [
    'Heureka! Wasser besteht aus Wasserstoff und Sauerstoff, H₂O. Mein Napf enthält also Chemie.',
    'Wie schwer etwas für seine Größe ist, nennt man Dichte. Damit soll Archimedes eine Krone geprüft haben.',
    'Gold hat das Zeichen Au, Silber Ag. Tippe auf das Periodensystem, dann siehst du noch mehr.',
    'Im Labor gilt: nichts anfassen, nichts probieren und immer die Schutzbrille auf. Auch wenn es nach Fisch riecht.',
    'Auch ich bestehe aus Chemie: Kohlenstoff, Wasserstoff, Sauerstoff, Stickstoff und ein bisschen Eitelkeit.',
    'Alles, was du siehst, besteht aus winzigen Teilchen. Das erklärt das Teilchenmodell.',
  ],
};
export const ROOM_ORDER = ['foyer', 'geschichte', 'biologie', 'chemie'];

// Kurze Rufe (Miau-Pose ohne Text), z. B. beim Aufwecken
export const MEOWS = ['Miau!', 'Mrrrau?', 'Prrr …', 'Mau.'];

// Karte am Wandbild („Hausherr“), kind 'info'
export const PORTRAIT_CARD = {
  kind: 'info', tag: 'Foyer', label: 'Archimedes, Hausherr',
  title: 'Archimedes, Hausherr', sub: 'Bibliothekskater, schlau und ein bisschen eingebildet',
  paras: [
    'Hausherr seit dem ersten Tag der großen Bibliothek. Er wacht über die Bücher, schläft gern auf dem Lesetisch und läuft vor, wenn du in einen anderen Raum willst.',
    'Er ist neugierig, hält sich für sehr klug und hat meistens recht. Tippe ihn an, dann sagt er dir etwas.',
  ],
  fact: 'Der echte Archimedes lebte um 287 bis 212 v. Chr. in Syrakus auf Sizilien. Wer ins Wasser taucht, wird leichter: um das Gewicht des Wassers, das er verdrängt. Das nennt man Auftrieb. In der Badewanne soll ihm das eingefallen sein, und er soll „Heureka!“ gerufen haben, „Ich hab’s gefunden!“.',
  src: 'Die Badewannen-Geschichte ist eine Überlieferung des römischen Baumeisters Vitruv, aufgeschrieben fast 200 Jahre nach Archimedes. Ob es genau so war, weiß niemand sicher.',
};
