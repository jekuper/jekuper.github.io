# Portfolio

Personal portfolio of Joe Sharipov. The hero is a small 2D particle engine
written from scratch in TypeScript and WebGL2: thousands of dots drift between
gravity wells, then spiral into line drawings when a skill is opened.

Controls on desktop:

| Input | Effect |
| --- | --- |
| Left click | Black hole |
| Ctrl + left click | Repelling black hole |
| Left drag and release | Throw a bomb that blows up the drawing |
| Right drag | Eraser |

## Running

```
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in docs/, for GitHub Pages
npm test           # engine unit tests
npm run lint
```

Each profile is a page at `/<profile id>/` (`/gamedev/`, `/backend/`); the root shows a
picker that lists them all, and unknown paths land there too. The build puts a copy of the page in each profile folder, so it works on
static hosts like GitHub Pages. The build goes to `docs/` and is committed: Pages serves it
with Settings > Pages > Deploy from a branch, folder `/docs`, at https://jekuper.github.io/.
Set `BASE_PATH` (default `/`) to serve from a subpath instead.

Append `?dots=50000` to the URL to stress test the engine with a bigger field, and
`?stats` to show frame rate, CPU time per frame and the live dot count.

`npm run preview:image` (with the dev server running) re-captures `public/og-image.png`,
the image shown in link previews. It uses an installed Edge or Chrome.

## Structure

```
src/engine     particle engine (no React): store, gravity, simulation, renderer, input
src/react      engine context for components
src/content    all text, links, skills, achievements and projects, grouped into profiles
src/sections   page sections, each one adapts to the desktop or mobile layout
src/components shared UI
tools/lineart  Python pipeline that turns drawings into line-art binaries
```

The engine has a small public API (`Engine` in `src/engine/Engine.ts`):
`seedField`, `morph`, `release`, `setEmitterAnchor`, `setInteractive`. All
tunable constants live in `src/engine/config.ts`.

## Editing content

Everything shown on the page comes from `src/content`. A `Profile` lists the
sections drawn over the canvas (`hero`) and the sections below it (`sections`),
each as a typed `{ type, data }` entry. To add a page for a different role,
add a profile in `src/content/profiles.ts` that reuses or replaces section data;
its key becomes its URL path.
To add a new kind of section, add its data type in `src/content/types.ts` and
its component to `src/sections/registry.tsx`.

## Usage metrics

Microsoft Clarity collects anonymous usage stats. It runs without cookies until the
visitor accepts the small toast in the corner, which sends Clarity the consent signal; the
answer is remembered and applied on later visits; add `?reset-consent` to the URL to
forget it. The snippet and project id are in `index.html`, the toast text in `metrics` in
`src/content/identity.ts`.

Clarity replays the page but cannot see the canvas, so interactions are also sent as named
events to filter recordings by: `engine-black-hole`, `engine-anti-black-hole`,
`engine-bomb`, `engine-eraser`, `figure-roll`, `figure-release`, `portrait-reveal`,
`project-reveal` and `project-link` (tag `project`), `menu-open`, `menu-jump` (tag
`section`), `email-copy`, `contact-topic` (tag `topic`) and `social-link` (tag `link`).

## Fonts

Three commercial fonts are expected in `public/fonts/`. The page falls back to
open fonts without them. See `public/fonts/README.md`.
