# How Chatbots Think

A playful, hands-on tour of how ChatGPT-style language models work, for kids, students and curious adults. Based on Andrej Karpathy's talk "Deep Dive into LLMs like ChatGPT".

It is a fully static site: React + React Three Fiber (Three.js), with no backend.

## Run it

```sh
npm install
npm run dev        # local dev server
npm run build      # production build into dist/
npm run preview    # serve dist/ locally
```

If `npm run dev` fails with `ENOSPC` (file watcher limit reached), either raise the limit
(`sudo sysctl fs.inotify.max_user_watches=524288`) or use `npm run build && npm run preview`.

## Deploy

Every push to `main` builds the site and publishes it to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml). It can also be run by hand from the Actions tab. One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

`dist/` is plain static files with relative paths (`base: './'`) and hash routing (`#/tokens`), so it works under a project URL like `https://<user>.github.io/<repo>/` and on Netlify, Cloudflare Pages or any static host, with no rewrite rules.

## What's live and what's recorded

| Chapter | How it works |
|---|---|
| Words → Token Beads, Teaching It to Chat, Swiss-Cheese Brain | The real GPT-4o tokenizer (`o200k_base` via `gpt-tokenizer`), loaded on demand (~1 MB gzipped) |
| The Guessing Game | A real ~9k-parameter neural network trained from scratch in a Web Worker on the stories in `src/model/corpus.ts` |
| Spin the Word Wheel | A word-level n-gram model built from the same stories, sampled with temperature |
| Practice Makes Better, Thumbs Up/Down | Small live simulations of RL and a reward model |
| Document Dreamer, Making Things Up, chat comparisons | Recorded examples, labelled as such on the page |

## Layout

- `src/chapters/`: one file per chapter, registered in `src/chapters/index.ts`
- `src/three/`: shared 3D pieces (`Stage`, `Toki` the mascot, `Bead`, `BeadRows`, `Sprinkles`, `useFit`)
- `src/model/`: tokenizer loader, story n-gram model, neural-net trainer worker, corpus
- `src/ui/`: chapter layout, Kid/Curious text switch, confetti, colours, error boundary
- `src/styles.css`: design tokens (light and dark), components, responsive rules

Each 3D canvas mounts only while its stage is on screen. On one-column layouts (phones, portrait tablets) the stage is pinned to the top so the scene stays visible while you use the controls.
