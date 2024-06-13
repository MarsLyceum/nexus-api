# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.14.0

FROM node:${NODE_VERSION}-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Use production node environment by default.
# ENV NODE_ENV production
ENV NODE_ENV dev

WORKDIR /usr/src/web

# Copy package.json and pnpm-lock.yaml first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.pnpm-store to speed up subsequent builds.
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile --prod

# Copy the rest of the source files into the image.
COPY . .

# Run the application as a non-root user.
USER node

# Expose the port that the application listens on.
EXPOSE 4000

# Run the application.
CMD ["pnpm", "start"]
