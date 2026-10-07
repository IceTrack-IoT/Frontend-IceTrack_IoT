FROM node:24-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --dangerously-allow-all-builds

COPY . .

RUN pnpm run build --configuration=production

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist/ice-track-frontend/browser /usr/share/nginx/html

EXPOSE 80
