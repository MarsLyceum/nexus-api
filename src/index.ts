#!/usr/bin/env node

/**
 * Module dependencies.
 */

import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server-express";

import { app } from "./app";
import { HelloResolver } from "./resolvers/index";

const port = process.env.PORT || "3000";
app.set("port", port);

/**
 * Create HTTP server.
 */
async function createServer() {
  const schema = await buildSchema({ resolvers: [HelloResolver] });
  const apolloServer = new ApolloServer({ schema });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app: app as any });
  app.listen(4000, () => {
    console.log("server started on http://localhost:4000/graphql");
  });
}

createServer();
