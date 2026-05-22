# Fixity-backend
Fixity Backend Repo

## Commands For Your Teammates
When your teammates clone your code from GitHub to their computers, here are the exact commands they should run in their terminal to start working:

### 1. Install all Node Dependencies
```bash
npm install
```

### 2. Start the Database
They must make sure Docker Desktop is open, then run:
```bash
docker-compose up -d
```

### 3. Setup the Database Schema (Prisma)
Prisma needs to read the schema file to generate its typescript definitions, and then actually build the tables inside the running Docker Postgres database:
```bash
npx prisma generate
npx prisma db push
```
*(Note: `prisma db push` safely synchronizes your schema with the local database. You'll switch to `npx prisma migrate dev` later when your schema is completely finalized).*

### 4. Start the Express Server
```bash
npm run dev
```

That's it! After doing that, the server will be running on http://localhost:3000 and they can start testing APIs or opening:
```bash
npx prisma studio
```
