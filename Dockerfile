# Build stage
FROM node:18 AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app /app
RUN npm install

EXPOSE 3000
CMD ["npm", "run", "dev"]
