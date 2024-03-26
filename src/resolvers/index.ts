// import "reflect-metadata";
// import { Resolver, Query } from "type-graphql";

// @Resolver()
// export class HelloResolver {
//   @Query(() => String)
//   async helloWorld() {
//     return "Hello World!";
//   }
// }

import { createUser } from "../db_operations/createUser";

export const resolvers = {
  Mutation: {
    registerUser(
      _: any,
      { email, password }: { email: string; password: string }
    ) {
      createUser(email, password);
    },
  },
  Query: {
    hello() {
      return "hello, world!";
    },
  },
};
