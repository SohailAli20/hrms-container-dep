# Use node:18 as base image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Install serverless globally
RUN npm install -g serverless

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Specify the variables you need (you can provide default values if needed)
ARG DB_HOST=localhost
ARG DB_PASSWORD=password
ARG DB_USER=root
ARG DB_PORT=3306

# Set environment variables
ENV DB_HOST=$DB_HOST
ENV DB_PASSWORD=$DB_PASSWORD
ENV DB_USER=$DB_USER
ENV DB_PORT=$DB_PORT

# Command to run your app
CMD ["serverless", "offline", "--host", "0.0.0.0"]
