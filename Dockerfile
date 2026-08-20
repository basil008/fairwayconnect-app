FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for version stamping (injected by deploy script)
ARG APP_VERSION=dev
ARG GIT_COMMIT=unknown
ARG BUILD_TIME
ARG NEXT_PUBLIC_ENV=unknown

# Make build args available as environment variables during build
ENV APP_VERSION=${APP_VERSION}
ENV GIT_COMMIT=${GIT_COMMIT}
ENV BUILD_TIME=${BUILD_TIME}
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}

RUN npm run build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/database ./database

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Re-declare build args as runtime environment variables
ARG APP_VERSION
ARG GIT_COMMIT
ARG BUILD_TIME
ARG NEXT_PUBLIC_ENV
ENV APP_VERSION=${APP_VERSION}
ENV GIT_COMMIT=${GIT_COMMIT}
ENV BUILD_TIME=${BUILD_TIME}
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}

CMD ["node", "server.js"]