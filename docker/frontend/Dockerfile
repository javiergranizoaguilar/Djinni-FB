# Build estatico del SPA con Vite y servido con nginx.
# El contexto de build es la raiz del repo para poder copiar tanto
# Djinni-F/ como docker/frontend/nginx.conf en una sola pasada.
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:8000
ARG VITE_WS_URL=ws://localhost:8081

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY Djinni-F/package*.json ./
RUN npm install --no-audit --no-fund

COPY Djinni-F/ ./
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
