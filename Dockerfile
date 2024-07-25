FROM node:20

WORKDIR /app
COPY yarn.lock ./
RUN yarn
RUN yarn build
COPY dist ./
EXPOSE 3000
CMD ["node", "dist/main.js"]