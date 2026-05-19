export interface DefaultActivity {
  name: string;
  description: string;
  points: number;
  daily_limit: number | null;
  weekly_limit: number | null;
  is_private_default: boolean;
}

export const DEFAULT_ACTIVITIES: DefaultActivity[] = [
  {
    name: "Oração pessoal",
    description: "Momento pessoal de oração diária.",
    points: 5,
    daily_limit: 1,
    weekly_limit: null,
    is_private_default: false,
  },
  {
    name: "Leitura bíblica",
    description: "Leitura da Bíblia ou Evangelho do dia.",
    points: 5,
    daily_limit: 1,
    weekly_limit: null,
    is_private_default: false,
  },
  {
    name: "Terço",
    description: "Oração do Santo Terço.",
    points: 10,
    daily_limit: 1,
    weekly_limit: null,
    is_private_default: false,
  },
  {
    name: "Santa Missa",
    description: "Participação na Santa Missa.",
    points: 20,
    daily_limit: 1,
    weekly_limit: null,
    is_private_default: false,
  },
  {
    name: "Adoração",
    description: "Momento de adoração ao Santíssimo.",
    points: 15,
    daily_limit: 1,
    weekly_limit: null,
    is_private_default: false,
  },
  {
    name: "Pregação/Formação",
    description: "Participação em formação, palestra ou pregação.",
    points: 10,
    daily_limit: null,
    weekly_limit: 2,
    is_private_default: false,
  },
  {
    name: "Vigília",
    description: "Participação em vigília ou momento prolongado de oração.",
    points: 25,
    daily_limit: null,
    weekly_limit: 1,
    is_private_default: false,
  },
  {
    name: "Ato de caridade",
    description: "Ação concreta de caridade.",
    points: 15,
    daily_limit: 1,
    weekly_limit: null,
    is_private_default: false,
  },
  {
    name: "Jejum/Penitência",
    description: "Prática pessoal de jejum ou penitência.",
    points: 10,
    daily_limit: 1,
    weekly_limit: null,
    is_private_default: true,
  },
];
