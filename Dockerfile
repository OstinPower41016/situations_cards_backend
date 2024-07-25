FROM node:20

WORKDIR /src
COPY . .
RUN yarn
EXPOSE 3000
CMD ["node", "app.js"]