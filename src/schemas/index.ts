export const schemas = `#graphql

  type User {
    id: String!
    email: String!
    firstName: String
    lastName: String
    age: Int
  }

  type Mutation {
    registerUser(email: String!, password: String!): User
  }
  type Query {
    hello: String
    loginUser(email: String!, password: String!): User
  }
`;
