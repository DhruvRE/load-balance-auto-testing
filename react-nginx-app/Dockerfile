# ---------- Stage 1: Build React App ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

# ---------- Stage 2: Serve via Nginx ----------
FROM nginx:1.27-alpine

RUN rm -rf /usr/share/nginx/html/*

# Copy built files from Vite's dist folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
    