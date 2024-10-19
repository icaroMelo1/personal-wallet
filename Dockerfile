# Use uma Node.js base image
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]