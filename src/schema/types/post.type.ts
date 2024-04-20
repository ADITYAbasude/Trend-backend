import { gql } from "apollo-server";

const postType = gql`
  type Post {
    id: ID!
    user_id: ID!
    caption: String
    meme_path: [String]
    popularity_score: Int!
    created_at: String!
    updated_at: String!
    user: User!
    aggregateComments: Int!
    votes: [votes!]
    totalVotes: Int!
    tagsBy: [tags!]
    total_views: Int!
    pageInfo: PageInfo!
  }

  type PageInfo{
    edges: [Post!]!
    hasNextPage: Boolean!
  }

  type CommentInfo{
    edges: [comments!]!
    hasFetchMore: Boolean!
  }

  type comments {
    id: ID!
    user_id: ID!
    post_id: ID!
    comment: String!
    votes: Int
    created_at: String!
    updated_at: String!
    user: User!
    commentvote: [commentvote!]
  }

  type votes {
    id: ID!
    user_id: ID!
    post_id: ID!
    vote: Int!
    created_at: String!
    updated_at: String!
  }

  type commentvote {
    id: ID!
    comment_id: ID!
    post_id: ID!
    vote: Int!
    created_at: String!
    updated_at: String!
  }

  type tags {
    id: ID!
    post_id: ID!
    tagger_id: ID!
    user: User!
    tagged_follower_id: ID!
    post_viewed: Boolean
    created_at: String!
    updated_at: String!
  }

  type taggers {
    id: ID!
    post_id: ID!
    user_id: ID!
    tagged_follower_ids: [ID!]
    created_at: String!
    updated_at: String!
  }

  type trendingTopics {
    topic: String!
    meme_count: String!
  }

  type Mutation {
    castVote(postId: ID!, userId: ID!, vote: Int!): Boolean!
    discontinueVote(postId: ID!, userId: ID!, value: Int!): Boolean!
    textComment(postId: ID!, userId: ID!, comment: String!): Boolean!
    castCommentVote(commentId: ID!, userId: ID!, vote: Int!): Boolean!
    discontinueCommentVote(commentId: ID!, userId: ID!, vote: Int!): Boolean!
    tagPost(postId: ID!, userId: ID!, taggers: [ID!]): Boolean!
    taggedPostSeenByUser(postId: ID!): Boolean!
  }

  type Query {
    getPost(id: ID!, offset: Int!, limit: Int!): PageInfo!
    getUserPost(token: String!, offset: Int!, limit: Int!): PageInfo!
    getComments(postId: ID!, userId: ID!): [comments!]
    getTaggers(postId: ID!, userId: ID!): [taggers!]
    searchTopics(search: String!, userId: ID!): [Post!]
    getTrendingTopicsWithOnOfMemes: [trendingTopics!]
    getPostById(postId: ID!, userId: ID!): Post!
  }
`;
export default postType;
