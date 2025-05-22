export const schemaTypeDefs = `#graphql

###########################
# Basic User and Group Types
###########################
scalar Upload

type Mutation {
  loginUser(
    email: String!
    password: String!
  ): LoginResponse

  refreshToken(refreshToken: String): RefreshTokenResponse

  registerUser(
    email: String!
    username: String!
    password: String!
    firstName: String!
    lastName: String!
    phoneNumber: String!
    status: UserOnlineStatus
  ): LoginResponse

  updateUser(
    id: String!
    email: String
    username: String
    firstName: String
    lastName: String
    phoneNumber: String
    status: UserOnlineStatus
  ): User

  # Group mutations
  createGroup(
    name: String!
    createdByUserId: String!
    publicGroup: Boolean!
    avatar: Upload!
  ): Group

  createGroupChannelMessage(
    id: String
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

  createPostComment(
    postedByUserId: String!
    content: String!
    attachments: [Upload!]
    postId: String!
    parentCommentId: String
    hasChildren: Boolean!
    upvotes: Int
  ): GroupChannelPostComment

  updateGroup(
    id: String!
    name: String
    description: String
  ): Group

  deleteGroup(id: String!): Boolean

  # Friend API mutations
  sendFriendRequest(
    userId: String!
    friendUserId: String!
  ): Friend

  acceptFriendRequest(friendId: String!): Friend

  removeFriend(friendId: String!): Boolean!

  # Direct Messaging API mutations
  createConversation(
    type: ConversationType!
    participantsUserIds: [String!]!
    requestedByUserId: String!
    channelId: String
  ): Conversation!

  sendMessage(
    conversationId: String!
    id: String!
    content: String!
    senderUserId: String!
    attachments: [Upload!]
  ): Message!

  updateMessage(
    conversationId: String!
    id: String!
    content: String!
    senderUserId: String!
  ): Message!

  deleteMessage(messageId: String!): Boolean!
  closeConversation(conversationId: String!, closedByUserId: String!): Boolean!
}

###########################
# Query Definitions
###########################

type Query {
  fetchUser(userId: String!): User
  fetchUserByEmail(email: String!): User
  searchForUsers(searchQuery: String!): [User!]!

  # Group queries
  fetchGroup(id: String!): Group
  fetchPost(id: String!): PostMessage
  fetchUserGroups(userId: String!): [GroupWithImage!]!
  fetchChannelMessages(
    channelId: String!
    offset: Int
    limit: Int
  ): [GroupChannelMessage!]!

  # Fetch paginated post comments
  fetchPostComments(
    postId: String!
    parentCommentId: String
    offset: Int
    limit: Int
  ): [GroupChannelPostComment!]!

  getFriends(userId: String!): [Friend!]!

  getConversations(userId: String!): [Conversation!]!
  getConversationMessages(conversationId: String!, offset: Int!, limit: Int!): [Message!]!
}

type Subscription {
  messageAdded(channelId: String!): GroupChannelMessage!

  friendStatusChanged(userId: String!): FriendStatusChangedPayload!

  dmAdded(conversationId: String!): Message!
}

enum UserOnlineStatus {
  online
  offline
  idle
  offline_dnd
  online_dnd
  invisible
}

type RefreshTokenResponse {
  accessToken: String!
  refreshToken: String!
  refreshTokenExpiresAt: String!
}

type User {
  id: String!
  email: String!
  username: String!
  firstName: String!
  lastName: String!
  phoneNumber: String!
  status: UserOnlineStatus!
}

type LoginResponse {
  id: String!
  email: String!
  username: String!
  firstName: String!
  lastName: String!
  phoneNumber: String!
  status: UserOnlineStatus!
  token: String
  accessToken: String!
  refreshToken: String!
  refreshTokenExpiresAt: String!
}

###########################
# Group API Types
###########################

input CreatePostCommentInput {
  content: String!
  postedByUserId: String!
  postId: String!
  parentCommentId: String
  upvotes: Int
  # If you need nested children input, recursively reference the same input type.
  children: [CreatePostCommentInput]
}

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
  attachmentUrls: [String!]
  children: [GroupChannelPostComment!]!  # Fetches nested replies
}

enum FriendStatus {
  pending
  accepted
  blocked
}

type Friend {
    id: String!
    user: User
    friend: User
    requestedBy: User
    status: FriendStatus!
    createdAt: String
    updatedAt: String
}

type FriendStatusChangedPayload {
  friendUserId: String!
  status: String!
}

enum ConversationType {
  direct,
  group,
  moderator
}

type Message {
    id: String!
    content: String!
    conversation: Conversation!
    senderUserId: String!
    createdAt: String!
    edited: Boolean!
    attachmentUrls: [String!]
}

type Conversation {
    id: String!
    type: ConversationType!
    participantsUserIds: [String!]!
    closedByUserIds: [String!]!
    messages: [Message!]!
    channelId: String
}

`;
