export const schemas = `#graphql

  type User {
    id: String!
    email: String!
    firstName: String
    lastName: String
    age: Int
    token: String!
  }

  type Mutation {
    registerUser(email: String!, password: String!): User
  }
  type Query {
    loginUser(email: String!, password: String!): User
  }
`;
