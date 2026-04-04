FROM node:20-alpine
WORKDIR /app
COPY package.json server.js ./
RUN npm install --production
EXPOSE 3100
CMD ["node", "server.js"]
