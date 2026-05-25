# Use official Node.js image
FROM node:18-alpine

# Install postgresql-client for pg_dump and psql
RUN apk add --no-cache postgresql-client

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD [ "node", "src/index.js" ]
