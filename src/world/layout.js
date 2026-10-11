// Grundriss: Foyer in der Mitte, Geschichte im Westen, Biologie im Norden, Chemie im Osten. Meter, Boden y=0.
// Die Räume werden in lokalen Koordinaten (Mitte = 0,0) gebaut und mit "offset" in die Welt gesetzt.
export const FOYER = { w: 14, d: 12, h: 6.4 };
export const WALL_T = 0.25;                       // Wanddicke je Raum (zwei Wände = 0,5 m Türtunnel)
export const DOOR = { w: 2.4, h: 3.3 };           // Rundbogentür (Breite, Höhe inkl. Bogen)

export const ROOMS = {
  foyer: { id: 'foyer', label: 'Foyer', size: FOYER, offset: [0, 0, 0] },
  geschichte: { id: 'geschichte', label: 'Geschichte', size: { w: 12, d: 10, h: 4.8 }, offset: [-(FOYER.w / 2 + 2 * WALL_T + 6), 0, 0], doorWall: 'E', color: 0xb8864a },
  biologie: { id: 'biologie', label: 'Biologie', size: { w: 10, d: 12, h: 5.2 }, offset: [0, 0, -(FOYER.d / 2 + 2 * WALL_T + 6)], doorWall: 'S', color: 0x5aa05a },
  chemie: { id: 'chemie', label: 'Chemie', size: { w: 12, d: 10, h: 4.8 }, offset: [FOYER.w / 2 + 2 * WALL_T + 6, 0, 0], doorWall: 'W', color: 0x3aa0a0 },
};
// Türen im Foyer: Wand und Weltposition der Türmitte (Boden)
export const FOYER_DOORS = {
  geschichte: { wall: 'W', world: [-FOYER.w / 2, 0, 0], inside: [-FOYER.w / 2 + 1.0, 0, 0], outside: [-FOYER.w / 2 - 1.2, 0, 0] },
  biologie: { wall: 'N', world: [0, 0, -FOYER.d / 2], inside: [0, 0, -FOYER.d / 2 + 1.0], outside: [0, 0, -FOYER.d / 2 - 1.2] },
  chemie: { wall: 'E', world: [FOYER.w / 2, 0, 0], inside: [FOYER.w / 2 - 1.0, 0, 0], outside: [FOYER.w / 2 + 1.2, 0, 0] },
};
export const DEPT_COLORS = { geschichte: '#a0522d', biologie: '#3f8f5a', chemie: '#2a9d9d' };
