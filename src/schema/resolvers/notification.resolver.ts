import { NOTIFICATION_ADDED } from "../../constant/notification.constant";
import pool from "../../utils/db";
import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub();

const notificationResolver = {
  Mutation: {
    op: async (_: void, { name }: { name: string }) => {
      console.log(name);
      pubsub.publish("TEST_EVENT", { opFinished: { full_name: "test data" } });

      return true;
    },
  },
  Query: {
    getNotifications: async (_: void, { userId }: { userId: string }) => {
      try {
        const result = await pool.query(
          "SELECT * FROM notification WHERE receiver_user_id = $1 ORDER BY created_at DESC",
          [userId]
        );

        return result.rows;
      } catch (err) {
        return []
      }
    },
  },
  Notification: {
    sender_user: async (parent: any) => {
      try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [
          parent.sender_user_id,
        ]);
        return result.rows[0];
      } catch (err) {
        console.log(err);
      }
    },
  },
  Subscription: {
    newNotification: {
      subscribe: () => {
        return pubsub.asyncIterator([NOTIFICATION_ADDED]);
      },
    },
    opFinished: {
      subscribe: () => {
        return pubsub.asyncIterator(["TEST_EVENT"]);
      },
    },
  },
};

export default notificationResolver;
