# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS runtime
RUN apk add --no-cache python3 make g++
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/src/lib/db/schema.ts ./src/lib/db/schema.ts
COPY --from=build /app/package.json ./

# Install drizzle-kit for migrations at runtime
RUN npm install drizzle-kit

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

ENV NODE_ENV=production
ENV DATABASE_URL=/data/topologr.db
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
