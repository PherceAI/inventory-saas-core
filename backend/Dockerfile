FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
# Copy backend package files
COPY backend/package*.json ./backend/
# Copy schema
COPY prisma ./prisma/

# Install root dependencies (for prisma CLI if needed)
RUN npm install

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Generate Prisma Client
# Schema path relative to backend dir: ../prisma/schema.prisma
RUN npx prisma generate --schema=../prisma/schema.prisma

# Copy source code
COPY backend ./

# Build NestJS app
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package.json for prod install
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/backend/dist ./dist

# Copy generated Prisma Client
COPY --from=builder /app/backend/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["node", "dist/main"]
