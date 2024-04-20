import { QueryResult } from "pg";
import { NOTIFICATION_POST } from "../constant/notification.constant";
import pool from "../utils/db";
import { pushNotification } from "./notification.db";

export const findMemes = async (postId: string) => {
  const query = `
    SELECT * FROM posts WHERE id = $1`;
  const { rows } = await pool.query(query, [postId]);
  return rows;
};

export const insertMeme = async (
  userId: string,
  caption: string,
  memePaths?: string[],
  postTopics?: string[]
) => {
  const post = await pool.query(
    `INSERT INTO posts (id, user_id, caption, meme_path, post_topics)
  VALUES (uuid_generate_v4(), $1, $2, $3 , $4) RETURNING id`,
    [userId, caption, memePaths, postTopics]
  );

  // get user followers list how follow xyz user
  const friendsList = await pool.query(
    `SELECT * FROM followers WHERE follower_id = $1`,
    [userId]
  );

  // insert notification for each follower
  friendsList.rows.forEach(async (friend: any) => {
    await pushNotification(
      userId,
      friend.user_id,
      post.rows[0].id,
      NOTIFICATION_POST
    );
  });
};

export const removeMeme = async (postId: string) => {
  await pool.query(`DELETE FROM posts WHERE id = $1`, [postId]);

  // remove notification
  await pool.query(`DELETE FROM notification WHERE post_id = $1`, [postId]);
};

export const insertVote = async (
  post_id: string,
  user_id: string,
  vote: number
) => {
  await pool.query(
    "INSERT INTO votes (post_id, user_id, vote) VALUES ($1, $2, $3)",
    [post_id, user_id, vote]
  );
  await pool.query(
    "UPDATE posts SET popularity_score = popularity_score + $1 WHERE id = $2",
    [vote, post_id]
  );
};

export const removeVote = async (
  post_id: string,
  user_id: string,
  value: number
) => {
  await pool.query("DELETE FROM votes WHERE post_id = $1 AND user_id = $2", [
    post_id,
    user_id,
  ]);
  await pool.query(
    "UPDATE posts SET popularity_score = popularity_score + $1 WHERE id = $2",
    [value, post_id]
  );
};

export const insertComment = async (
  post_id: string,
  user_id: string,
  comment: string
) => {
  await pool.query(
    "INSERT INTO comments (post_id, user_id , comment) VALUES ($1, $2 , $3)",
    [post_id, user_id, comment]
  );
};

export const retrieveComments = async (
  post_id: string,
  user_id: string
) => {
  //TODO: change comments logic
  return await pool.query(
    `SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC`,
    [post_id]
  );
};

export const insertCommentVote = async (
  commentId: string,
  userId: string,
  vote: number
) => {
  await pool.query(
    `INSERT INTO commentsvote (comment_id, user_id, vote) VALUES ($1, $2, $3)`,
    [commentId, userId, vote]
  );
  await pool.query(`UPDATE comments SET votes = votes + $1 WHERE id = $2`, [
    vote,
    commentId,
  ]);
};

export const removeCommentVote = async (
  commentId: string,
  userId: string,
  vote: number
) => {
  await pool.query(
    "DELETE FROM commentsvote WHERE comment_id = $1 AND user_id = $2",
    [commentId, userId]
  );
  //TODO: check this bug
  await pool.query(`UPDATE comments SET votes = votes - $1 WHERE id = $2`, [
    vote,
    commentId,
  ]);
};

export const taggerPostToUser = async (
  postId: string,
  userId: string,
  taggers: string[]
) => {
  await pool.query(
    "INSERT INTO taggers (post_id, user_id, tagged_follower_ids) VALUES ($1, $2, $3) RETURNING (id)",
    [postId, userId, taggers]
  );
};

export const getPost = async (
  userId: string,
  offset: number,
  limit: number
) => {
  const result = await pool.query(
    `SELECT DISTINCT p.*
    FROM posts p
    LEFT JOIN followers f ON p.user_id = f.follower_id
    LEFT JOIN taggers t ON p.id = t.post_id
    WHERE (p.user_id = $1 
		   OR $1 = ANY(t.tagged_follower_ids) 
		   OR f.user_id = $1)
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows;
};

export const updateTotalViewsOfPost = async (postId: string) => {
  await pool.query(
    `UPDATE posts SET total_views = (1 + total_views) WHERE id = $1`,
    [postId]
  );
};
