FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files (if shared deps exist, though frontend seems isolated)
COPY package*.json ./
# Copy frontend package files
COPY frontend/package*.json ./frontend/

# Install root dependencies
RUN npm install

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install

# Copy source code
COPY frontend ./

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/frontend/public ./public

# Copy standalone build
# Next.js standalone output puts dependencies in .next/standalone/node_modules
# and creates a server.js in .next/standalone
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
