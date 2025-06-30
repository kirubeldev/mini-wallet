# Base image for building
FROM node:18 AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build the Next.js app
RUN npm run build

# ---- Production image ----
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app /app

# Install only production dependencies
RUN npm install --omit=dev

EXPOSE 3000
EXPOSE 4000

# Run the Next.js app and json-server concurrently in production
CMD ["sh", "-c", "concurrently \"npm run start\" \"json-server --watch db.json --port 4000\""]
