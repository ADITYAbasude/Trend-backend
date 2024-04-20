import { gql } from "apollo-server";

const notificationType = gql`
  type Notification {
    id: ID!
    sender_user_id: ID!
    receiver_user_id: ID!
    post_id: ID
    notification_type: Int!
    sender_user: User!
    created_at: String!
    updated_at: String!
  }

  type Query {
    getNotifications(userId: ID!): [Notification]!
  }

  type foo {
    full_name: String!
  }

  type Mutation {
    op(name: String!): Boolean!
  }

  type Subscription{
    newNotification: Notification!
    opFinished: foo!
  }
`;


export default notificationType;
