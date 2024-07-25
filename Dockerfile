FROM node:20

WORKDIR /app
COPY . .
RUN yarn
EXPOSE 3000
CMD ["node", "app.js"]