# CodeWithKK Notes — Premium Bundle

Landing page for the codewith_kk notes bundle. Built with React + Vite.

## Folder structure

```
codewithkk-notes/
├── public/
│   └── favicon.svg          # site icon
├── src/
│   ├── App.jsx               # the landing page component
│   ├── main.jsx               # React entry point
│   └── index.css              # global reset
├── index.html                 # HTML shell (fonts, meta tags)
├── package.json
├── vite.config.js
├── .env.example                # copy to .env, fill in real values
├── .env                          # local dev env (git-ignored)
├── .gitignore
├── .eslintrc.cjs
└── README.md
```

There's no separate `pages/` folder because this is a single-page site — if you
later add routing (e.g. `/dashboard`), create `src/pages/` and wire up
`react-router-dom`.

## 1. Install dependencies

```bash
npm install
```

This creates the `node_modules/` folder locally (it's git-ignored and not part
of the zip — always regenerated from `package.json`, so the project stays
small to share and deploy).

## 2. Configure environment variables

```bash
cp .env.example .env
```

Then open `.env` and set `VITE_CHECKOUT_URL` to your real payment link
(Razorpay/Stripe/Instamojo checkout page, etc). The "Buy Now" button in the
pricing section reads this at build time.

## 3. Run locally

```bash
npm run dev
```

Opens at `http://localhost:5173`.

## 4. Build for production

```bash
npm run build
```

Outputs static files to `dist/`. Preview the production build locally with:

```bash
npm run preview
```

## 5. Deploy

Any static host works since this is a plain Vite build:

- **Vercel**: import the repo, framework preset "Vite" is auto-detected.
  Add `VITE_CHECKOUT_URL` under Project → Settings → Environment Variables.
- **Netlify**: build command `npm run build`, publish directory `dist`.
  Add the env var under Site settings → Environment variables.
- **Any static host** (GitHub Pages, S3 + CloudFront, etc): upload the
  contents of `dist/` after running `npm run build`.

Remember to set `VITE_CHECKOUT_URL` in the host's dashboard too — `.env` is
git-ignored and won't be deployed automatically.
