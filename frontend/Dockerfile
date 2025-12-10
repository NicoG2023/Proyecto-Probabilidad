# === Etapa 1: Build ===
FROM node:20-alpine AS build
WORKDIR /app

# pnpm
RUN npm install -g pnpm

# Copiamos lo mínimo para aprovechar caché
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copiamos el resto del código
COPY . .

# Puedes usar un modo específico si quieres (.env.docker, etc.)
# RUN pnpm build --mode docker
RUN pnpm build --mode docker

# === Etapa 2: Nginx para servir estático ===
FROM nginx:alpine AS prod
WORKDIR /usr/share/nginx/html

# Copiamos el build de Vite
COPY --from=build /app/dist .

# Sobreescribir configuración por defecto de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
