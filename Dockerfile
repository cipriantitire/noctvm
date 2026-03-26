# syntax=docker/dockerfile:1

# Base image for Node.js
FROM node:24-alpine

# Use /app as the working directory inside the container
WORKDIR /app

# Copy only package.json and package-lock.json to leverage Docker layer caching
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the standard Next.js development port
EXPOSE 3000

# Next.js development server command
CMD ["npm", "run", "dev"]
