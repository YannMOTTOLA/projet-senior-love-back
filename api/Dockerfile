FROM node:22
 
RUN corepack enable && corepack prepare pnpm@latest --activate
 
WORKDIR /app
 
COPY package*.json pnpm-lock.yaml ./
 
RUN pnpm install --ignore-scripts
 
RUN pnpm rebuild argon2
RUN pnpm rebuild @prisma/client prisma
 
COPY . .
 
RUN pnpm run db:generate
RUN pnpm run build
 
EXPOSE 3000
 
CMD ["pnpm", "run", "docker:start"]