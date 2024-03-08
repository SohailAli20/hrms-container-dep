# Stage 1: Build stage
FROM node:18 AS build

# Set the working directory in the build stage
WORKDIR /app

# Install serverless globally
RUN npm install -g serverless

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Stage 2: Production stage
FROM node:18-slim

# Set the working directory in the production stage
WORKDIR /app

# Copy the entire node_modules directory from the build stage to the production stage
COPY --from=build /app/node_modules /app/node_modules

# Copy the application files from the build stage to the production stage
COPY --from=build /app ./

# Expose the port your app runs on
EXPOSE 4000

# Command to run your app
CMD ["node", "node_modules/serverless/bin/serverless", "offline", "--host", "0.0.0.0"]
