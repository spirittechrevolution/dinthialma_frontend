# ===================================================================
# Dinthialma Frontend – Dockerfile multi-stage
# ===================================================================
# Stage 1 : BUILD  – compile TypeScript + bundle Vite (npm)
# Stage 2 : RUNTIME – nginx:alpine sert les fichiers statiques
#
# Build :
#   docker build \
#     --build-arg VITE_API_URL=https://api.dinthialma.com \
#     -t dinthialma-frontend:latest .
# ===================================================================

# ─── Stage 1 : Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les manifests en premier pour profiter du cache Docker
COPY package.json package-lock.json ./

RUN npm ci --frozen-lockfile

COPY . .

# URL de l'API backend – injectée au build (Vite compile import.meta.env.VITE_*)
ARG VITE_API_URL=http://localhost:8081
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build


# ─── Stage 2 : Runtime ───────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="Dinthialma Frontend"
LABEL org.opencontainers.image.vendor="Spirit Tech Revolution"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
