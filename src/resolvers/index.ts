import "reflect-metadata";
import { Resolver, Query } from "type-graphql";

@Resolver()
export class HelloResolver {
  @Query(() => String)
  async helloWorld() {
    return "Hello World!";
  }
}
