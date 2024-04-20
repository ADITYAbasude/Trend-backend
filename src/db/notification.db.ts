import { PubSub } from "graphql-subscriptions";
import { NOTIFICATION_ADDED } from "../constant/notification.constant";
import pool from "../utils/db";

const pubsub = new PubSub();
const TEST_EVENT = "TEST_EVENT";

const sub = pubsub.asyncIterator(NOTIFICATION_ADDED);
sub.next().then((data) => {
  console.log(data);
});

pubsub.publish(TEST_EVENT, { data: "test data" });

export const pushNotification = async (
  senderUserId: string,
  receiverUserId: string,
  postId: string | null,
  notificationType: number
) => {
  return await pool.query(
    `INSERT INTO notification (sender_user_id, receiver_user_id, post_id, notification_type)
      VALUES ($1, $2, $3, $4) RETURNING *`,
    [senderUserId, receiverUserId, postId, notificationType]
  );


  // pubsub.publish(NOTIFICATION_ADDED, { newNotification: result.rows[0] });
};

export const deleteNotification = async (
  senderUserId: string,
  receiverUserId: string,
  notificationType: number
) => {
  await pool.query(
    `DELETE FROM notification WHERE sender_user_id = $1 AND receiver_user_id = $2 AND notification_type = $3`,
    [senderUserId, receiverUserId, notificationType]
  );
};
