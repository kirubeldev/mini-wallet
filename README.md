
# 💰 Mini Wallet App

A modern wallet management app built with **Next.js 15**, **Tailwind CSS**, **Zustand**, and **json-server**. It features user authentication, wallet display with balance alerts, dark mode, and mock API integration.

---

## 🚀 Features

- User registration, login, and auto-login with cookies
- Wallet display with low-balance alerts
- Light/Dark theme support
- Zustand for global state
- SWR for API mutations and fetch
- Jest setup for testing hooks

---

## 📦 Tech Stack

Next.js · Tailwind CSS · Zustand · SWR · json-server · Jest

---

## 📂 Structure Overview

- `app/dashboard/page.tsx` – Dashboard route
- `components/ATMCard.tsx` – Wallet card
- `components/dashboard/Dashboard.tsx` – Page logic
- `hooks/useAuth.ts` – Custom auth hooks (login, register, auto-login)
- `store/AuthStore.ts` – Zustand store
- `db.json` – Mock backend for users/wallets

---








## ⚙️ Setup & Run

```bash



1) npm install




2) in the package.json part add this on the script

    "dev": "concurrently \"next dev\" \"json-server --watch db.json --port 4000\"",






 i have updated the endpoint to the render instade of the local db.server for global use

3) npm run dev 










📦 Services,  this is for the container 
app — Next.js development server (http://localhost:3000)

api — json-server for fake REST API (http://localhost:4000)



for the rundev i have alredy set up the jeson server s when you run the run dev you will get the db.server runn too, it is et up in the package.json file


  //  "dev": "concurrently \"next dev\" \"json-server --watch db.json --port 4000\"",





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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# mini-wallet
