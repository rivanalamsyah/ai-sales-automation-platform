FROM node:18-alpine

WORKDIR /app

# Install dependencies first for build caching
COPY package*.json ./
RUN npm ci

# Copy database schema for client generation
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source and configurations
COPY . .

# Build application code
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
