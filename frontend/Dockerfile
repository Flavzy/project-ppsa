# ==============================================================================
# Production Multi-Stage Dockerfile untuk Frontend React (Vite)
# Tahap 1: Build dengan Node.js
# Tahap 2: Serving aset statis & reverse proxy dengan Nginx
# ==============================================================================

# ------------------------------------------------------------------------------
# Tahap 1: Build Stage
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definition
COPY package*.json ./

# Install dependensi secara bersih (clean install)
RUN npm ci

# Salin source code frontend
COPY . .

# Argument API URL untuk proses build Vite (default ke /api agar relatif ke domain Nginx)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Jalankan build produksi Vite -> output ke folder /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Tahap 2: Production Nginx Stage
# ------------------------------------------------------------------------------
FROM nginx:alpine

# Hapus konfigurasi default bawaan Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Salin konfigurasi Nginx khusus React Router & API routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin output hasil build dari tahap 1 ke webroot Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port HTTP
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
