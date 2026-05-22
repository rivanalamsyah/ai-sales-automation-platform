FROM node:18-alpine

WORKDIR /app

# Install dependencies first for build caching
COPY package*.json ./
RUN npm ci

# Copy configuration and sources
COPY . .

# Build NextJS production resources
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
