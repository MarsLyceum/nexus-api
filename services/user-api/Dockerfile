# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.3.0

FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Use production node environment by default.
ENV NODE_ENV=production

# Set the pnpm store directory
ENV PNPM_HOME="/usr/local/share/.pnpm"
RUN mkdir -p ${PNPM_HOME}
ENV PATH="${PNPM_HOME}/bin:${PATH}"

WORKDIR /usr/src/web


# Copy the necessary files from the repo
# The build context is the root of peeps-api rather than the service so everything
# is relative to that
COPY . .

# Remove existing node_modules to avoid conflicts
RUN rm -rf node_modules

# Install only production dependencies for the service
RUN pnpm install

# Change the working directory to the service directory
WORKDIR /usr/src/web/services/user-api

# Remove existing node_modules to avoid conflicts
RUN rm -rf node_modules

# Install only production dependencies for the service
RUN pnpm install --frozen-lockfile --prod

# Run the application as a non-root user
USER node

# Expose the port that the application listens on
EXPOSE 4000

# Set the environment variable for the port
ENV PORT=4000

# Run the application
CMD ["pnpm", "run", "start"]
