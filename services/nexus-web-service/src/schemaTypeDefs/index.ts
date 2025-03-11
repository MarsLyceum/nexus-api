export const schemaTypeDefs = `#graphql

###########################
# Basic User and Group Types
###########################
scalar Upload

input CreatePostCommentInput {
  content: String!
  postedByUserId: String!
  postId: String!
  parentCommentId: String
  upvotes: Int
  # If you need nested children input, recursively reference the same input type.
  children: [CreatePostCommentInput]
}

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
    username: String!
    firstName: String!
    lastName: String!
    phoneNumber: String!
  ): User

  # Group mutations
  createGroup(
    name: String!
    createdByUserId: String!
    publicGroup: Boolean!
    avatar: Upload!
  ): Group

  createGroupChannelMessage(
    postedByUserId: String!
    channelId: String!
    content: String!
    messageType: String!   # "message" for a regular message or "post" for a post message
    title: String
    flair: String
    domain: String
    thumbnail: String
    attachments: [Upload!]
  ): GroupChannelMessage

    # content: string;
    # postedByUserId: string;
    # postId: string;
    # parentCommentId?: string | null; // Optional for top-level comments
    # children?: CreateGroupChannelPostCommentPayload[]; // Nested replies
    # upvotes?: number; // Defaults to 0 if not provided

  createPostComment(
    postedByUserId: String!
    content: String!
    attachments: [Upload!]
    postId: String!
    parentCommentId: String
    hasChildren: Boolean!
    children: [CreatePostCommentInput!]
    upvotes: Int
  ): GroupChannelPostComment

  updateGroup(
    id: String!
    name: String
    description: String
  ): Group

  deleteGroup(id: String!): Boolean
}

###########################
# Query Definitions
###########################

type Query {
  fetchUser(userId: String!): User
  fetchUserByEmail(email: String!): User

  # Group queries
  fetchGroup(id: String!): Group
  fetchPost(id: String!): PostMessage
  fetchUserGroups(userId: String!): [GroupWithImage!]!
  fetchChannelMessages(
    channelId: String!
    offset: Int
  ): [GroupChannelMessage!]!

  # Fetch paginated post comments
  fetchPostComments(
    postId: String!
    parentCommentId: String
    offset: Int
    limit: Int
  ): [GroupChannelPostComment!]!
}

type Subscription {
  greetings: String
  messageAdded(channelId: String!): GroupChannelMessage!
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

type GroupWithImage {
  id: String!
  name: String!
  createdByUserId: String!
  createdAt: String!  # ISO date string
  description: String
  members: [GroupMember!]!
  channels: [GroupChannel!]!
  avatarUrl: String!
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
  messageType: String!   # Either "message" or "post"
  attachmentUrls: [String!]
}

# A regular message implements the interface.
type RegularMessage implements GroupChannelMessage {
  id: String!
  content: String!
  postedAt: String!
  edited: Boolean!
  channelId: String!
  postedByUserId: String!
  messageType: String!   # Expected value: "message"
  attachmentUrls: [String!]
}

# A post message implements the interface and adds extra fields.
type PostMessage implements GroupChannelMessage {
  id: String!
  content: String!
  postedAt: String!
  edited: Boolean!
  channelId: String!
  postedByUserId: String!
  messageType: String!   # Expected value: "post"
  title: String!
  flair: String
  domain: String
  thumbnail: String
  upvotes: Int!
  commentsCount: Int!
  shareCount: Int!
  attachmentUrls: [String!]
}

# A communication channel within a group.
type GroupChannel {
  id: String!
  name: String!
  type: GroupChannelType!
  createdAt: String!  # ISO date string
  groupId: String!
  messages: [GroupChannelMessage!]
}

###########################
# Post Comments
###########################

# Represents a comment on a post.
type GroupChannelPostComment {
  id: String!
  content: String!
  postedAt: String!
  edited: Boolean!
  postedByUserId: String!
  postId: String!
  parentCommentId: String
  upvotes: Int!
  hasChildren: Boolean!
  children: [GroupChannelPostComment!]!  # Fetches nested replies
}

`;
