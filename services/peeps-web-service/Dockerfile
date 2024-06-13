# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.3.0

FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /usr/src/web

# Copy package.json and pnpm-lock.yaml first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Download dependencies as a separate step to take advantage of Docker's caching.
RUN pnpm install --frozen-lockfile --prod

# Remove local node_modules to avoid conflicts
RUN rm -rf node_modules

# Copy the rest of the source files into the image.
COPY . .

# Reinstall dependencies with the correct store location
RUN rm -rf node_modules
RUN pnpm install --frozen-lockfile --prod

# Ensure native modules like bcrypt are rebuilt
RUN pnpm rebuild bcrypt

# Run the application as a non-root user.
USER node

# Expose the port that the application listens on.
EXPOSE 4000

# Set the environment variable for the port
ENV PORT=4000

# Run the application.
CMD pnpm run start
