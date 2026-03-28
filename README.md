# DesiMedia

DesiMedia is a Next.js collaboration platform focused on friend groups and communities with realtime messaging, group chat, profile + follow system, and meme sharing.

## Current Implementation

- Next.js App Router + TypeScript + Tailwind CSS
- Prisma data model for users, relationships, conversations, participants, messages, and notifications
- NextAuth setup with credentials and Google provider wiring
- Registration API endpoint
- Conversation list/create API endpoint
- Minimal cool UI shell with landing, chat, profile, and login screens

## Run Locally

1. Install dependencies:
   npm install
2. Copy env file:
   copy .env.example .env
3. Add your PostgreSQL connection and auth secrets in .env
4. Generate Prisma client:
   npm run prisma:generate
5. Run migrations:
   npm run prisma:migrate
6. Start development server:
   npm run dev

## Next Steps

- Add message send/read APIs and realtime Socket.IO rooms
- Add follow/following APIs and profile edit endpoints
- Add meme upload with object storage
- Add moderation actions (remove member, delete messages, report/block)
- Add post-launch voice/video calling with Jitsi
