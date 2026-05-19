# BookBazar

BookBazar is an online second-hand book resale marketplace where students can buy and sell books within their university community. The platform operates on a C2C commission-based model.

## Tech Stack
- Frontend: Next.js 14, Tailwind CSS
- Backend: Node.js, Express.js, MongoDB, Socket.io
- Payments: Stripe (Test Mode)

## Setup Instructions

### 1. Backend Setup
\`\`\`bash
cd backend
npm install
cp .env.example .env # Update the variables with your actual credentials
npm run dev
\`\`\`

### 2. Frontend Setup
\`\`\`bash
cd frontend
npm install
cp .env.local.example .env.local # Or create one with NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
\`\`\`

The app will be available at http://localhost:3000

## Deploy to Railway

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions (backend + frontend services, MongoDB, and environment variables).
