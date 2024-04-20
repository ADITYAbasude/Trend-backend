import { gql } from "apollo-server";

const userType = gql`
  type User {
    id: ID!
    mobile_number: String!
    full_name: String!
    username: String!
    profile_picture: String
    bio: String
    password: String!
    Following: Boolean!
    totalMemes: Int!
    totalFollowers: Int!
    totalPopularity: Int!
    created_at: String!
    updated_at: String!
  }

  type Follower {
    id: ID!
    user_id: ID!
    follower_id: ID!
    created_at: String!
    updated_at: String!
    User: User!
  }

  type Mutation {
    handleFollow(followerId: ID!, userId: ID!): Boolean!
    handleUnfollow(followerId: ID!, userId: ID!): Boolean!
  }
  
  type Query {
    getIdByUsername(username: String!): ID!
    getUser(id: ID!, yourId: ID!): User!
    searchUser(search: String! , id: ID!): [User]
    searchFollowerUsers(id: ID! ): [Follower]!
    getTrendingUsers(id: ID!): [User]!
  }
`;

export default userType;
