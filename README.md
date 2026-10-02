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
npm run build      # static site in dist/
npm test           # engine unit tests
npm run lint
```

Append `?dots=50000` to the URL to stress test the engine with a bigger field.

## Structure

```
src/engine     particle engine (no React): store, gravity, simulation, renderer, input
src/react      engine context for components
src/content    all text, links, skills, stats and projects, grouped into profiles
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
add a profile in `src/content/profiles.ts` that reuses or replaces section data.
To add a new kind of section, add its data type in `src/content/types.ts` and
its component to `src/sections/registry.tsx`.

## Fonts

Three commercial fonts are expected in `public/fonts/`. The page falls back to
open fonts without them. See `public/fonts/README.md`.
