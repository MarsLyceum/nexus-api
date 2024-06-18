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
                  firstName: String!,
                  lastName: String!,
                  phoneNumber: String!
                ): User
  }
  type Query {
    fetchUser(email: String!): User
  }

  type Subscription {
    greetings: String
  }
`;
