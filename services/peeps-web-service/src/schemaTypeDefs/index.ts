export const schemaTypeDefs = `#graphql

  type User {
    id: Int!
    email: String!
    firstName: String!
    lastName: String!
    age: Int!
    token: String!
  }

  type Mutation {
    registerUser( email: String!,
                  password: String!,
                  firstName: String!,
                  lastName: String!,
                  age: Int!,
                ): User
  }
  type Query {
    loginUser(email: String!, password: String!): User
  }

  type Subscription {
    greetings: String
  }
`;
