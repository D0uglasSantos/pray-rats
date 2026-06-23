import {
  CalendarDays,
  HandHeart,
  Home,
  Sparkles,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AppTourStep {
  id: string;
  title: string;
  description: string;
  supplemental?: string;
  target?: string;
  fallbackTarget?: string;
  placement?: "top" | "bottom" | "auto";
  icon?: LucideIcon;
  isWelcome?: boolean;
  isFinal?: boolean;
}

export const APP_TOUR_STEPS: AppTourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao PrayRats ✝️",
    description:
      "O PrayRats ajuda você a transformar pequenos momentos de fé em constância, junto com seus amigos e seu grupo.",
    icon: Sparkles,
    isWelcome: true,
  },
  {
    id: "home-stats",
    title: "Sua caminhada de hoje",
    description:
      "Aqui você acompanha sua sequência de dias, os pontos da semana e tudo o que já realizou hoje.",
    supplemental: "Na Jornada você encontra seu calendário e seu histórico espiritual.",
    target: "home-stats",
    placement: "bottom",
    icon: Home,
  },
  {
    id: "active-group",
    title: "Seu grupo de fé",
    description:
      "Este é seu grupo ativo. Quando participar de mais de um grupo, você poderá alternar entre eles por aqui.",
    target: "active-group",
    placement: "bottom",
    icon: Users,
  },
  {
    id: "check-in",
    title: "Registre um momento de fé",
    description:
      "Use o check-in para registrar oração, leitura, missa, jejum ou outra atividade configurada pelo seu grupo.",
    supplemental:
      "Você pode adicionar foto, duração, escolher os grupos e definir a visibilidade do registro.",
    target: "home-checkin-cta",
    fallbackTarget: "nav-checkin",
    placement: "top",
    icon: HandHeart,
  },
  {
    id: "group",
    title: "Caminhe em comunidade",
    description:
      "Na área do grupo você acompanha os participantes, estatísticas, atividades e os momentos de fé compartilhados.",
    target: "nav-group",
    placement: "top",
    icon: Users,
  },
  {
    id: "ranking",
    title: "Acompanhe sua evolução",
    description:
      "Veja sua posição semanal, mensal e geral. O ranking existe para incentivar a constância, não para transformar a fé em competição.",
    target: "nav-ranking",
    placement: "top",
    icon: Trophy,
  },
  {
    id: "profile",
    title: "Seu perfil e preferências",
    description:
      "Edite seus dados, gerencie grupos, configure notificações e abra este tutorial novamente quando precisar.",
    target: "nav-profile",
    placement: "top",
    icon: User,
  },
  {
    id: "final",
    title: "Tudo pronto para começar 🙏",
    description:
      "Registre seu primeiro momento de fé e dê o próximo passo na sua caminhada.",
    icon: CalendarDays,
    isFinal: true,
  },
];

export const APP_TOUR_STEP_COUNT = APP_TOUR_STEPS.length;

export function getAppTourProgressLabel(stepIndex: number): string {
  const contentSteps = APP_TOUR_STEPS.filter((s) => !s.isWelcome && !s.isFinal);
  const contentIndex = APP_TOUR_STEPS
    .slice(0, stepIndex + 1)
    .filter((s) => !s.isWelcome && !s.isFinal).length;
  if (contentIndex <= 0) return "";
  return `${contentIndex} de ${contentSteps.length}`;
}
