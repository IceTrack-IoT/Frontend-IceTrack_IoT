FROM node:24.21.0-alpine3.21 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build -- --configuration=production

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/ice-track-frontend/browser /usr/share/nginx/html

EXPOSE 80
