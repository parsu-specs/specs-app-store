// ─────────────────────────────────────────────────────────────
// EDIT THIS FILE to update the About page. Everything here is placeholder
// content: swap in real names, roles, bios, and photo URLs anytime.
// Photos accept any https:// image link (or leave imageUrl empty for
// an initials avatar).
// ─────────────────────────────────────────────────────────────

export const CONTACT_EMAIL = "parsu.specs@gmail.com";

export const APP_INFO = {
  name: "CodeCanvas",
  tagline: "A home for what you build.",
  description:
    "A community app store by SPECS, a computer science student organization, where student developers publish software, exchange feedback, find collaborators, and share progress.",
  features: [
    {
      title: "Discover something new",
      body: "Explore student-built apps, read their stories, and meet the developers behind them.",
    },
    {
      title: "Share your next idea",
      body: "Give your project a home with screenshots, documentation, and a space for thoughtful feedback.",
    },
    {
      title: "Build with your community",
      body: "Find collaborators, share progress in the feed, and celebrate the projects moving forward.",
    },
  ],
};

export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  imageUrl?: string;
  color: string;
};

export const TEAM: TeamMember[] = [
  {
    name: "Jay Romero",
    role: "Lead Developer",
    bio: "Owns the overall direction of the app store and keeps releases moving.",
    imageUrl: "https://picsum.photos/seed/specs-dev-1/200",
    color: "yellow",
  },
  {
    name: "Kirby Paladan",
    role: "Frontend Developer | Backend Developer | Database Handler | Security Handler | Penetration Tester | QA Engineer | DevOps | UI/UX",
    bio: "mapping both codebases, then shipping features (vote notifications, publish bonus, theme and signup fixes) alongside hardening program (RLS policies, vote/claim guards, fail-closed admin API, CSP/headers, timeouts, telemetry, runbook) that took the app from local prototype to secured production on Vercel with Supabase.",
    imageUrl:
      "https://raw.githubusercontent.com/kirbypaladan24-lgtm/Images-/9bb4a4a68a66d65c73329d3df1847962205ddb68/IMG_20251222_194153_156.jpg",
    color: "mint",
  },
];
