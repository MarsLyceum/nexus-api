export const schemaTypeDefs = `#graphql


  type User {
    id: String!
    email: String!
    firstName: String!
    lastName: String!
    phoneNumber: String!
  }

  type Mutation {
    registerUser(
      email: String!
      firstName: String!
      lastName: String!
      phoneNumber: String!
    ): User

    # Group mutations
    createGroup(
      name: String!
      createdByUserEmail: String!
      description: String
    ): Group

    updateGroup(
      id: String!
      name: String
      description: String
    ): Group

    deleteGroup(id: String!): Boolean
  }

  type Query {
    fetchUser(email: String!): User

    # Group queries
    fetchGroup(id: String!): Group
    fetchUserGroups(email: String!): [Group!]!
  }

  type Subscription {
    greetings: String
  }

  ##############################################
  # Group API Types
  ##############################################

  # A group represents a collection of members and channels.
  type Group {
    id: String!
    name: String!
    createdByUserEmail: String!
    createdAt: String!  # ISO date string
    description: String
    members: [GroupMember!]!
    channels: [GroupChannel!]!
    avatarFilePath: String
  }

  enum GroupRole {
    owner
    admin
    moderator
    member
  }

  # A member of a group.
  type GroupMember {
    userEmail: String!
    groupId: String!
    role: GroupRole!
    joinedAt: String!  # ISO date string
  }

  enum GroupChannelType {
    text
    voice
  }

  # A communication channel within a group.
  type GroupChannel {
    id: String!
    name: String!
    type: GroupChannelType!
    createdAt: String!  # ISO date string
    groupId: String!
  }
`;
