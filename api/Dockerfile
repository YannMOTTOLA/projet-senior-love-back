
FROM node:22
 
RUN corepack enable && corepack prepare pnpm@latest --activate
 
WORKDIR /app
 
COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
 
RUN pnpm install
 
COPY . .
 
RUN pnpm run db:generate
RUN pnpm run build
 
EXPOSE 3000
 
CMD ["pnpm", "run", "docker:start"]
 