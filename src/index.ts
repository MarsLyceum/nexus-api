#!/usr/bin/env node

/**
 * Module dependencies.
 */

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import { json } from "express";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import { app } from "./app";
// import { HelloResolver } from "./resolvers/index";
import { schemas } from "./schemas";
import { resolvers } from "./resolvers/index";

const port = process.env.PORT || "4000";
app.set("port", port);

/**
 * Create HTTP server.
 */
async function createServer() {
  const apolloServer = new ApolloServer({
    typeDefs: schemas,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer: app as any })],
  });

  await apolloServer.start();

  app.post(
    "/graphql",
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({ token: req.headers.token }),
    })
  );

  app.listen(port, () => {
    console.log(`server started on http://localhost:${port}/graphql`);
  });
}

createServer();
