# Use the official lightweight Node.js 12 image.
# https://hub.docker.com/_/node
FROM node:16-slim

# Create and change to the app directory.
WORKDIR ./

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

RUN apt-get update || : && apt-get install python -y && apt-get install -y pkg-config libxi-dev
# Copy local code to the container image.
COPY . ./

# Install dependencies.
# If you add a package-lock.json speed your build by switching to 'npm ci'.
# RUN npm ci --only=production
RUN yarn install



# Run the web service on container startup.
CMD [ "yarn", "start" ]
