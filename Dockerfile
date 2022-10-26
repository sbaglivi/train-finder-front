FROM node:16-alpine
# WORKDIR /app think we don't need it any more since we use the /app in docker-compose?
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "run", "start"]