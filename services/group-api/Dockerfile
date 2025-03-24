# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.14.0

##########################
# Stage 1: Builder
##########################
FROM --platform=linux/amd64 node:${NODE_VERSION}-alpine AS builder

# Set tracing sampling rate (if needed during build)
ENV TRACING_SAMPLING_RATE=1

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory for the entire repository
WORKDIR /usr/src/web

# Copy the full repository (build context is the repo root)
COPY . .

# Remove any existing node_modules and install all workspace dependencies
RUN rm -rf node_modules
RUN pnpm install

# Change directory to the service folder and compile the TypeScript code
WORKDIR /usr/src/web/services/group-api
RUN pnpm run compile

##########################
# Stage 2: Production
##########################
# Use a Debian-based Node slim image for better compatibility with Playwright.
FROM --platform=linux/amd64 node:${NODE_VERSION}-slim AS production

# Set production environment variables.
ENV TRACING_SAMPLING_RATE=1
ENV NODE_ENV=production
ENV PNPM_HOME="/usr/local/share/.pnpm"
ENV CI=true
ENV PLAYWRIGHT_BROWSERS_PATH="/usr/src/browsers"

# Create the pnpm store directory and update PATH.
RUN mkdir -p ${PNPM_HOME}
ENV PATH="${PNPM_HOME}/bin:${PATH}"

# Install pnpm globally.
RUN npm install -g pnpm

# Install OS dependencies required for Chromium.
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libexpat1 \
    libxfixes3 \
    libgbm1 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2 \
    libxcursor1 \
    libgtk-3-0 \
    libpangocairo-1.0-0 \
    libcairo-gobject2 \
    libgstreamer1.0-dev \
    libgtk-4-1 \
    libgraphene-1.0-0 \
    libatomic1 \
    libxslt1.1 \
    libwoff-dev \
    libvpx7 \
    libevent-2.1-7 \
    libopus0 \
    libgstreamer-plugins-base1.0-0 \
    flite \
    libwebpdemux2 \
    libavif15 \
    libharfbuzz-icu0 \
    libwebpmux3 \
    libenchant-2-2 \
    libsecret-1-0 \
    libhyphen0 \
    libmanette-0.2-0 \
    libnghttp2-14 \
    libgles2-mesa \
    libx264-dev \
    libgstreamer-gl1.0-0 \
    libgstreamer-plugins-bad1.0-0 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Set working directory for the entire repository.
WORKDIR /usr/src/web

# Copy the entire repository from the builder stage.
COPY --from=builder /usr/src/web .

# Remove pre-copied node_modules to avoid conflicts.
RUN rm -rf node_modules

# Install Playwright manually using pnpm (ignoring workspace) and then install Chromium.
RUN pnpm add playwright --ignore-workspace-root && npx playwright install chromium

RUN pnpm exec playwright install

# Install only production dependencies for the entire workspace.
RUN pnpm install --prod --frozen-lockfile

# (Optional) Explicitly copy entrypoint.sh if it's not already in your repository.
COPY services/group-api/entrypoint.sh /usr/src/web/services/group-api/entrypoint.sh

# Make sure the entrypoint script is executable.
RUN chmod +x /usr/src/web/services/group-api/entrypoint.sh


# Change directory to the service folder.
WORKDIR /usr/src/web/services/group-api

# Set HOME for node user
ENV HOME=/home/node
RUN mkdir -p /home/node


# Run the application as a non-root user.
USER node

# Expose the port that the application listens on.
EXPOSE 4000
ENV PORT=4000


# Start the application.
# CMD ["xvfb-run", "--auto-servernum", "--server-args=-screen 0 1280x1024x24", "pnpm", "run", "start-ci"]
CMD ["/usr/src/web/services/group-api/entrypoint.sh"]
