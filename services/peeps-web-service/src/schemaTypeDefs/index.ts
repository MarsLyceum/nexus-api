export const schemaTypeDefs = `#graphql

  ###########################
  # Basic User and Group Types
  ###########################
  type User {
    id: String!
    email: String!
    username: String!
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
      createdByUserId: String!
      description: String
    ): Group

    createGroupChannelMessage(
      postedByUserId: String!
      channelId: String!
      content: String!
      messageType: MessageType!
      title: String
      flair: String
      domain: String
      thumbnail: String
    ): GroupChannelMessageUnion

    updateGroup(
      id: String!
      name: String
      description: String
    ): Group

    deleteGroup(id: String!): Boolean
  }

  type Query {
    fetchUser(userId: String!): User
    fetchUserByEmail(email: String!): User

    # Group queries
    fetchGroup(id: String!): Group
    fetchUserGroups(userId: String!): [Group!]!
    fetchChannelMessages(
      channelId: String!
      offset: Int
    ): [GroupChannelMessageUnion!]!
  }

  type Subscription {
    greetings: String
  }

  ###########################
  # Group API Types
  ###########################

  # A group represents a collection of members and channels.
  type Group {
    id: String!
    name: String!
    createdByUserId: String!
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
    userId: String!
    groupId: String!
    role: GroupRole!
    joinedAt: String!  # ISO date string
  }

  enum GroupChannelType {
    text
    voice
    feed
  }

  enum MessageType {
    message
    post
  }

  ###########################
  # Message Types
  ###########################

  # An interface representing the common fields of any channel message.
  interface GroupChannelMessage {
      id: String!
      content: String!
      postedAt: String!
      edited: Boolean!
      channelId: String!
      postedByUserId: String!
      messageType: MessageType!
  }

  # A regular message implements the interface.
  type RegularMessage implements GroupChannelMessage {
      id: String!
      content: String!
      postedAt: String!
      edited: Boolean!
      channelId: String!
      postedByUserId: String!
      messageType: MessageType!  # always "message"
  }

  # A post message implements the interface and adds extra fields.
  type PostMessage implements GroupChannelMessage {
      id: String!
      content: String!
      postedAt: String!
      edited: Boolean!
      channelId: String!
      postedByUserId: String!
      messageType: MessageType!  # always "post"
      title: String!
      flair: String
      domain: String
      thumbnail: String
      upvotes: Int!
      commentsCount: Int!
      shareCount: Int!
  }

  # A union that can be either a regular message or a post message.
  union GroupChannelMessageUnion = RegularMessage | PostMessage

  # A communication channel within a group.
  type GroupChannel {
    id: String!
    name: String!
    type: GroupChannelType!
    createdAt: String!  # ISO date string
    groupId: String!
    messages: [GroupChannelMessageUnion!]!
  }
`;
