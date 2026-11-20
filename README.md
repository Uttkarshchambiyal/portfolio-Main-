<div align="center">

# Uttkarsh Chambiyal — Portfolio

### Frontend developer · B.Tech CSE student · Bengaluru

[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![GSAP](https://img.shields.io/badge/GSAP-ScrollTrigger-0AE448?style=for-the-badge&logo=greensock&logoColor=111)](https://gsap.com/)
[![WebGL](https://img.shields.io/badge/WebGL-Shaders-990000?style=for-the-badge&logo=webgl&logoColor=white)](https://developer.mozilla.org/docs/Web/API/WebGL_API)

[Live site](https://www.uttkarshchambiyal.com/) · [Run locally](#run-locally) · [Edit content](#editing-content)

</div>

---

## What's on the page

| Section | What it does |
| --- | --- |
| **Hero** | A light hero: my name runs huge behind a centred portrait with a soft lime glow, over faint contour lines, with a small notched card and a short intro. The cursor opens a lens that redraws the face as a moving lime contour map. On scroll it pins, the page turns olive, the photo shrinks into a framed portrait and a hand-drawn signature writes across it. |
| **Statement** | A centred statement whose words light up as you read. |
| **Journey** | The section pins and slides sideways through milestone tiles and quotes; the surface fades from olive to paper on the way. |
| **Build / Solve** | Two big doors into the page, with lime swooshes and giant braces sliding in from the edges. |
| **Selected work** | The six projects pinned on GitHub in a staggered card grid with notched labels; the columns drift at different speeds. |
| **Problems solved** | A rolling odometer and a "solution matrix": one square per problem solved, counted live from the LeetCode, HackerRank, Codeforces and DSA repos. |
| **Tools & tech** | A brush-script word writes itself over the title, with two rows of logos sliding in opposite directions. |
| **Hire** | What I'm looking for, next to a loose collage of cards. |
| **Find me online** | GitHub, LinkedIn, X and email as a hand of cards that fans out. |
| **Footer** | Lime-framed card with a raised tab, the statement and quick links. |

Every big title is uncovered by a sweeping block of colour, the background fades between olive, night and paper, and scrolling is smoothed with Lenis. Visitors with *reduced motion* enabled get a static version.

## Tech

- **Vite** for dev server and production build
- **GSAP + ScrollTrigger** for every animation
- **Lenis** for smooth scrolling
- **Raw WebGL** fragment shaders for the contour-line backgrounds (no 3D library)
- **GitHub REST API** for live numbers (cached for an hour per visitor)

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Editing content

| To change | Edit |
| --- | --- |
| Text, projects, journey, links | `index.html` |
| Colours, fonts, spacing | the variables at the top of `styles.css` |
| Animations | `script.js` (each section has its own commented block) |
| Project screenshots | `public/project-previews/*.webp` (1600×1000) |
| Tech logos | `public/logos/*.svg` ([Simple Icons](https://simpleicons.org/), CC0) |
| Link-preview image | `public/og-image.jpg` (1200×630) |

**Résumé:** add the file at `public/resume.pdf`, then remove the `hidden` attribute from the "Résumé (PDF)" link in the hire section of `index.html`.

## Deploy

Any static host works. On Vercel or Netlify use build command `npm run build` and output directory `dist`.

## Connect

[GitHub](https://github.com/Uttkarshchambiyal) · [LinkedIn](https://www.linkedin.com/in/uttkarsh-chambiyal/) · [X](https://x.com/uttkarshx26) · [Email](mailto:uttkarshchambiyal26@gmail.com)
