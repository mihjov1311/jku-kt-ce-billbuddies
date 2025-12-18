This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


# Testing

```bash
# Aufgrund von React 19 müssen Abhängigkeiten zwingend mit folgendem Flag installiert werden:
npm install --legacy-peer-deps
# Führt alle Tests im Ordner /test einmalig aus.
npm test
# Startet den Watch-Modus (Tests laufen bei jeder Speicherung neu).
npx jest --watch
# Validiert neben dem Build auch, ob die App produktionsbereit ist.
npm run build
# Test Coverage anzeigen
npm run test:coverage
```
