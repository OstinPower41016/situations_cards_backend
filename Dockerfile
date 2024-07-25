FROM node:20

WORKDIR /app
COPY yarn.lock ./
RUN yarn
COPY . .
EXPOSE 3000
CMD ["node", "dist/main.js"]