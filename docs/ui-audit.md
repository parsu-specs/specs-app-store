# UI conventions and project audit

## Shared component rules

| Need                                                        | Component                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------- |
| Standard actions and action links                           | `Button`, `ButtonLink`                                        |
| Custom icon controls, menu options, palette cards, switches | `Button` icon/menu variants; `plain` for bespoke compositions |
| Checkbox / file input                                       | `Checkbox`, `FileInput` from `Input.tsx`                      |
| File chooser label                                          | `ButtonLabel` wrapping or targeting a native file input       |
| Text/search/password fields                                 | `Input`                                                       |
| Native form selections                                      | `Select` from `Input.tsx`                                     |
| Multiline text                                              | `Textarea` from `Input.tsx`                                   |
| Growing Markdown editor                                     | `MarkdownTextarea`                                            |
| Filter listbox                                              | `Dropdown`                                                    |
| Product lockup, profile picture, project card               | `Brand`, `Avatar`, `AppCard`                                  |

Standard calls to action use the primary/secondary/surface Button variants, including ?Submit your first project.? Use the shared icon, menu, text, and filter variants instead of repeating their visual styles. Filters support both `aria-pressed` and tab `aria-selected` states. Reserve `plain` for bespoke compositions such as palette cards, image triggers, and switches.

Navigation/action links use `ButtonLink`, preserving anchor semantics and destinations. `Checkbox` and `FileInput` from `Input.tsx` retain native checked, disabled, file, and ref behavior without text-field styling. `ButtonLabel` shows focus around nested upload controls; separate file controls can use a peer focus indicator. Native interactive tags are confined to the Button/Input primitives; semantic layout HTML and Markdown renderer output remain native.

## Responsive layout fixes

- Project, profile, About, and developer collections use component-owned Tailwind grid utilities: `repeat(auto-fit, minmax(min(100%, 18rem), 1fr))`. Columns adapt to the content container instead of the viewport alone.
- Discovery app cards and profile project cards fill their grid track up to `max-w-sm` (24rem / 384px at the default root size), preventing sparse results from becoming oversized.
- Grid children can shrink below their intrinsic text width. Paper cards wrap long unbroken user content; AppCard headings and action rows can wrap.
- Screenshot upload previews use adaptive tracks with an 8rem preferred minimum; screenshot galleries use an 18rem preferred minimum and settings tiles use 16rem. They follow container width instead of viewport breakpoints.
- The breadcrumb appears with the desktop sidebar at `lg`; its trail wraps. It no longer reserves a sidebar margin on tablets while the sidebar is absent.
- Footer and landing split tracks use `minmax(0, ...)` to permit shrinking. Landing navigation wraps; leaderboard rows can wrap on mobile.
- Theme medal/trophy colors are centralized in the CSS theme. Form controls share Input sizing and styling through the shared primitives. Component styles live in Tailwind classes; global CSS is limited to theme tokens and document/browser defaults.
- Dropdown wraps a styled native select. The browser owns popup placement, touch interaction, keyboard selection, and focus, without measured coordinates or a portal.
- Flex/grid containers and direct children have local shrinking constraints; controls and rows have maximum widths and wrap long text/actions. Nested submission, project-edit, and profile-edit forms use the named `content` container at 36rem, including matching column spans.
- Paper surfaces retain the restored clipped upper-right polygon, tape, and shadows through component-owned Tailwind utilities. Keep controls and focus indicators clear of the cut corner. Discovery cards do not rotate into adjacent tracks.
- MarkdownTextarea uses native `field-sizing: content` where supported. Its legacy fallback resizes after value or width changes; both paths cap height at `min(60dvh,32rem)` before scrolling internally.
- PagedMarkdown observes an unclipped inner wrapper, independently of visible paging height. The final content is fully revealed without the former 24px tolerance.
- Breadcrumb actions use semantic buttons instead of clickable labels.

## Sizing validation (2026-10-20)

Headless Edge checks covered nine application routes at 280, 320, 360, 390, 640, 768, 1024, and 1440 CSS pixels. No viewport overflow or browser runtime errors were found in those checks. A separate pass used long unbroken project names, profile names/roles, descriptions, URLs, Markdown, and comments at 280, 390, 768, 1024, and 1440px, including project/profile editing, mobile account and notification menus, and sign-in/signup. That pass also completed without detected overflow or runtime errors.

Component browser checks verified stepped Markdown expansion/collapse, complete final content visibility, detection after resizing, native select changes, textarea growth/shrinkage and capped internal scrolling, and the legacy textarea fallback after both value and width changes. These are functional layout checks in Edge with isolated local data, not measured performance gains or verification on physical iOS/Android devices. External image/provider requests were blocked during the route checks.

## Documentation maintenance

Maintained documentation now lives under `docs/` with an index and linked root README. Setup distinguishes local, Supabase, and HTTP backends; architecture and companion instructions describe current routes and implemented persistence. Removed stale fixed test counts and claims that a separate admin application's behavior was verified here. The root PDF remains a historical artifact.

## Manual regression checklist

Use 320px, 375px, 768px, 1024px, and 1440px viewports. Browser validation is separate from automated build/type/test checks.

1. Visit Landing, About, Login, Discover, Developers, profile, project detail, Feed, leaderboard, and Settings.
2. Check one-column mobile cards, container-based column changes, long project/profile names and URLs, and wrapped actions without clipped controls.
3. Open project submission/editing, add screenshots, and inspect Markdown previews and two-column form transitions.
4. Confirm mobile top/bottom bars clear content; confirm sidebar/breadcrumb alignment at 1024px.
5. Open native dropdowns with keyboard and pointer; verify option labels, arrow/Enter selection, Escape, and focus return.
6. Check palette selection, password visibility, comments, notifications, and dialog closing with visible keyboard focus.

Live Supabase policy/auth/provider behavior and external admin applications require their own environment checks. This UI/documentation pass does not migrate databases or change backend contracts.
