import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { GraphQLSchema } from "graphql";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server-express";

import { getRootRouter } from "./routes/index";
import { getUsersRouter } from "./routes/users";
import { postRegisterRoute } from "./routes/register";
import { HelloResolver } from "./resolvers/index";

export const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", getRootRouter);
app.use("/users", getUsersRouter);
app.use(postRegisterRoute);

async function bs() {
  const schema = await buildSchema({ resolvers: [HelloResolver] });
  ApolloServer;
  app.use(
    "/graphql",
    graphqlHTTP({
      schema,
      graphiql: true,
    })
  );
}

bs();

// catch 404 and forward to error handler
app.use(function (
  req: any,
  res: any,
  next: (arg0: createError.HttpError<404>) => void
) {
  next(createError(404));
});

// error handler
app.use(function (
  err: { message: any; status: any },
  req: { app: { get: (arg0: string) => string } },
  res: {
    locals: { message: any; error: any };
    status: (arg0: any) => void;
    render: (arg0: string) => void;
  },
  next: any
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
