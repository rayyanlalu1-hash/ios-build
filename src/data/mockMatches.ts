import { Match, CommentaryTrack } from "../types";

export const commentaryTracks: CommentaryTrack[] = [
  { code: "en", name: "English commentary", flag: "🇬🇧", channel: "FIFA Network HD • NBC Sports", commentator: "Peter Drury & Jon Champion" },
  { code: "es", name: "Comentario en Español", flag: "🇲🇽", channel: "Telemundo Deportes 4K", commentator: "Andrés Cantor & Manuel Sol" },
  { code: "ar", name: "التعليق العربي", flag: "🇸🇦", channel: "beIN Sports Premium UHD", commentator: "Khalil Al-Balushi" },
  { code: "fr", name: "Commentaire Français", flag: "🇫🇷", channel: "TF1 Live Stream", commentator: "Grégoire Margotton" },
  { code: "pt", name: "Narraçao em Português", flag: "🇧🇷", channel: "SporTV Premium", commentator: "Milton Leite" }
];

export const initialMatches: Match[] = [
  {
    id: "match-1",
    homeTeam: {
      name: "Brazil",
      code: "BRA",
      flag: "🇧🇷",
      color: "#FEDD00",
      secondaryColor: "#009739"
    },
    awayTeam: {
      name: "Morocco",
      code: "MAR",
      flag: "🇲🇦",
      color: "#C1272D",
      secondaryColor: "#006233"
    },
    homeScore: 0,
    awayScore: 1,
    status: "LIVE",
    minute: 24,
    group: "Group F",
    stadium: "MetLife Stadium, East Rutherford",
    spectators: "82,500",
    referee: "Szymon Marciniak (Poland)",
    goals: [
      { minute: 18, player: "Hakim Ziyech", teamCode: "MAR" }
    ],
    stats: {
      possession: [50, 50],
      shots: [3, 4],
      shotsOnTarget: [1, 2],
      xg: [0.35, 0.65],
      fouls: [2, 3],
      yellowCards: [0, 0],
      redCards: [0, 0],
      offsides: [1, 0],
      corners: [1, 2],
      passes: [85, 92],
      passAccuracy: [88, 85]
    },
    lineups: {
      home: {
        formation: "4-3-3",
        players: [
          { id: "h1", name: "Ederson Moraes", number: 23, position: "GK", rating: 7.2, goalsInTournament: 0, speed: 65, stamina: 90, x: 50, y: 12 },
          { id: "h2", name: "Danilo da Silva", number: 2, position: "DEF", rating: 6.9, goalsInTournament: 0, speed: 78, stamina: 85, x: 15, y: 28 },
          { id: "h3", name: "Marquinhos Aoás", number: 3, position: "DEF", rating: 7.3, goalsInTournament: 0, speed: 79, stamina: 88, x: 38, y: 25 },
          { id: "h4", name: "Gabriel Magalhães", number: 4, position: "DEF", rating: 7.1, goalsInTournament: 0, speed: 75, stamina: 85, x: 62, y: 25 },
          { id: "h5", name: "Guilherme Arana", number: 16, position: "DEF", rating: 7.0, goalsInTournament: 0, speed: 82, stamina: 88, x: 85, y: 28 },
          { id: "h6", name: "Bruno Guimarães", number: 5, position: "MID", rating: 7.5, goalsInTournament: 0, speed: 78, stamina: 94, x: 50, y: 45 },
          { id: "h7", name: "Lucas Paquetá", number: 8, position: "MID", rating: 7.4, goalsInTournament: 0, speed: 81, stamina: 90, x: 25, y: 50 },
          { id: "h8", name: "João Gomes", number: 15, position: "MID", rating: 7.0, goalsInTournament: 0, speed: 77, stamina: 91, x: 75, y: 50 },
          { id: "h9", name: "Raphinha Dias", number: 7, position: "FWD", rating: 7.6, goalsInTournament: 0, speed: 89, stamina: 86, x: 15, y: 72 },
          { id: "h10", name: "Rodrygo Goes", number: 10, position: "FWD", rating: 8.2, goalsInTournament: 2, speed: 90, stamina: 88, x: 50, y: 76 },
          { id: "h11", name: "Vinícius Júnior", number: 11, position: "FWD", rating: 8.6, goalsInTournament: 4, speed: 97, stamina: 90, x: 85, y: 72 }
        ]
      },
      away: {
        formation: "4-3-3",
        players: [
          { id: "a1", name: "Yassine Bounou", number: 1, position: "GK", rating: 7.4, goalsInTournament: 0, speed: 62, stamina: 90, x: 50, y: 88 },
          { id: "a2", name: "Achraf Hakimi", number: 2, position: "DEF", rating: 8.0, goalsInTournament: 1, speed: 94, stamina: 92, x: 15, y: 72 },
          { id: "a3", name: "Nayef Aguerd", number: 5, position: "DEF", rating: 7.1, goalsInTournament: 0, speed: 76, stamina: 84, x: 38, y: 75 },
          { id: "a4", name: "Romain Saïss", number: 6, position: "DEF", rating: 7.0, goalsInTournament: 0, speed: 68, stamina: 82, x: 62, y: 75 },
          { id: "a5", name: "Noussair Mazraoui", number: 3, position: "DEF", rating: 7.3, goalsInTournament: 0, speed: 83, stamina: 87, x: 85, y: 72 },
          { id: "a6", name: "Sofyan Amrabat", number: 4, position: "MID", rating: 7.4, goalsInTournament: 0, speed: 74, stamina: 95, x: 35, y: 55 },
          { id: "a7", name: "Azzedine Ounahi", number: 8, position: "MID", rating: 7.5, goalsInTournament: 1, speed: 82, stamina: 90, x: 65, y: 55 },
          { id: "a8", name: "Selim Amallah", number: 15, position: "MID", rating: 6.9, goalsInTournament: 0, speed: 75, stamina: 86, x: 15, y: 38 },
          { id: "a9", name: "Hakim Ziyech", number: 7, position: "MID", rating: 7.8, goalsInTournament: 2, speed: 85, stamina: 83, x: 50, y: 35 },
          { id: "a10", name: "Sofiane Boufal", number: 17, position: "MID", rating: 7.2, goalsInTournament: 0, speed: 88, stamina: 82, x: 85, y: 38 },
          { id: "a11", name: "Youssef En-Nesyri", number: 19, position: "FWD", rating: 7.9, goalsInTournament: 3, speed: 86, stamina: 85, x: 50, y: 18 }
        ]
      }
    },
    timeline: [
      { id: "t1", minute: 1, type: "sub", teamCode: "BRA", player: "Match Officials", detail: "Anthems completed. Kickoff in progress! Brazil vs Morocco is underway at MetLife Stadium." }
    ],
    heroImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1470&auto=format&fit=crop",
    date: "2026-06-13"
  }
];

export const mockGoalScorersPool = {
  BRA: ["Vinícius Júnior", "Rodrygo Goes", "Endrick", "Raphinha Dias", "Gabriel Martinelli", "Lucas Paquetá"],
  MAR: ["Youssef En-Nesyri", "Hakim Ziyech", "Achraf Hakimi", "Azzedine Ounahi", "Sofiane Boufal", "Abde Ezzalzouli"],
  URU: ["Darwin Núñez", "Federico Valverde", "Nicolás de la Cruz", "Giorgian De Arrascaeta", "Facundo Pellistri"],
  FRA: ["Kylian Mbappé", "Antoine Griezmann", "Marcus Thuram", "Ousmane Dembélé", "Eduardo Camavinga"],
  ARG: ["Lionel Messi", "Julián Álvarez", "Lautaro Martínez", "Enzo Fernández", "Alexis Mac Allister"],
  POR: ["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Rafael Leão", "João Félix"]
};

export const mockTimelineEventsPool = [
  { type: "shot", detail: "Fires a powerful shot from the edge of the area, but the keeper deflects it with a diving save!" },
  { type: "foul", detail: "Commits a professional foul to stop a dangerous counterattack. No booking." },
  { type: "card-yellow", detail: "Shown a yellow card for a late, reckless challenge from behind." },
  { type: "offside", detail: "Caught offside after running slightly too early onto a through ball." },
  { type: "shot", detail: "Attempts a dramatic overhead bicycle kick, but it sails just wide of the post!" },
  { type: "card-yellow", detail: "Booked for kicking the ball away in frustration after an offside whistle." },
  { type: "sub", detail: "Undergoes a tactical substitution as fresh legs enter the midfield." },
  { type: "foul", detail: "Unintentionally trips an opponent during a heated battle for possession in the center circle." }
];
