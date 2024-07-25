FROM node:20 AS builder

WORKDIR /app
COPY ./package*.json ./
RUN yarn
COPY . .
RUN yarn build

FROM node:20-slim

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/docker/nginx.conf ./etc/nginx/nginx.conf

EXPOSE 3000
CMD ["node", "dist/src/main.js"]