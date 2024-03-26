export const schemas = `#graphql

  type UserCredentials {
    username: String!
    password: String!
  }

  type Mutation {
    registerUser(username: String!, password: String!): UserCredentials
  }
  type Query {
    hello: String
  }
`;
