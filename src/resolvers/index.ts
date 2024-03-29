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
import { loginUser } from "../db_operations/loginUser";

export const resolvers = {
  Mutation: {
    registerUser(
      _: any,
      { email, password }: { email: string; password: string }
    ) {
      return createUser(email, password);
    },
  },
  Query: {
    loginUser(
      _: any,
      { email, password }: { email: string; password: string }
    ) {
      return loginUser(email, password);
    },
  },
};
