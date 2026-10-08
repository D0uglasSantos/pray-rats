export const PUBLIC_DOCUMENT_ALIASES = [
  "/privacy",
  "/terms",
  "/support",
  "/privacidade",
  "/termos",
  "/suporte",
  "/pt",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/termos-de-servico",
  "/ajuda",
  "/help",
] as const;

export const PUBLIC_SITE_REDIRECTS = [
  { source: "/politica-de-privacidade", destination: "/privacy" },
  { source: "/termos-de-uso", destination: "/terms" },
  { source: "/termos-de-servico", destination: "/terms" },
  { source: "/ajuda", destination: "/support" },
  { source: "/help", destination: "/support" },
  { source: "/pt/privacy", destination: "/privacy" },
  { source: "/pt/terms", destination: "/terms" },
  { source: "/pt/support", destination: "/support" },
  { source: "/pt/privacidade", destination: "/privacy" },
  { source: "/pt/termos", destination: "/terms" },
  { source: "/pt/suporte", destination: "/support" },
] as const;
