# syntax=docker/dockerfile:1

ARG NODE_VERSION="22.14.0"

#################################
# Stage 0: Bundle with esbuild
#################################
FROM node:${NODE_VERSION}-alpine AS bundler
ARG SERVICE_NAME
WORKDIR /usr/src/web

# 1) Install pnpm & esbuild
RUN npm install -g pnpm esbuild

# 2) Copy only your service + its manifest
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY services/${SERVICE_NAME} ./services/${SERVICE_NAME}

# 3) Install all deps, compile monorepo, then bundle service
RUN pnpm install --no-frozen-lockfile \
    && pnpm -r run compile \
    && esbuild services/${SERVICE_NAME}/src/index.ts \
    --bundle \
    --platform=node \
    --target=node22 \
    --outfile=services/${SERVICE_NAME}/dist/bundle.js

#################################
# Stage 1: Builder (prod modules)
#################################
FROM node:${NODE_VERSION}-alpine AS builder
ARG SERVICE_NAME
WORKDIR /usr/src/web

# 4) Install pnpm, copy manifests
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# 4.1) Copy workspace packages so pnpm can link locals
COPY packages ./packages

# 5) Copy only service manifest & lockfile context
COPY services/${SERVICE_NAME}/package.json ./services/${SERVICE_NAME}/package.json

# 6) Install prod deps for your service only
RUN pnpm install --prod --no-frozen-lockfile --filter ./services/${SERVICE_NAME}...

#################################
# Stage 2: Distroless Production
#################################
FROM gcr.io/distroless/nodejs22-debian12
ARG SERVICE_NAME
WORKDIR /app

# 8) Copy the bundled single file
COPY --from=bundler /usr/src/web/services/${SERVICE_NAME}/dist/bundle.js ./bundle.js

# 9) Copy only the service’s production node_modules
COPY --from=builder /usr/src/web/node_modules ./node_modules

# 10) Use nonroot user for security
USER nonroot

# 11) Healthcheck (optional but recommended)
HEALTHCHECK --interval=30s --timeout=5s \
    CMD ["wget","--quiet","--tries=1","--spider","http://localhost:4000/health"] || exit 1

EXPOSE 4000
ENV PORT=4000

# 12) Launch your bundled file directly
CMD ["bundle.js"]
