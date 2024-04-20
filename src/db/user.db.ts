import pool from "../utils/db";
import { QueryResult } from "pg";
import { deleteNotification, pushNotification } from "./notification.db";
import { NOTIFICATION_FOLLOW } from "../constant/notification.constant";

export const insertNewUser = async (
  mailId: String,
  fullName: String,
  username: String,
  hashPassword: String
): Promise<QueryResult<any>> => {
  return await pool.query(
    "INSERT INTO users (mail_id, full_name, username, password) VALUES ($1, $2, $3, $4) RETURNING ID",
    [mailId, fullName, username, hashPassword]
  );
};

export const getUserByID = async (id: string): Promise<QueryResult<any>> => {
  return await pool.query("SELECT * FROM users WHERE id = $1", [id]);
}

export const insertUserProfilePicture = async (
  userId: String,
  profilePicture: String | null
): Promise<void> => {
  await pool.query("UPDATE users SET profile_picture = $1 WHERE id = $2 ", [
    profilePicture,
    userId,
  ]);
};

export const updateUser = async (
  userId: String,
  fullName: String,
  bio: String
): Promise<void> => {
  await pool.query("UPDATE users SET full_name = $1, bio = $2 WHERE id = $3", [
    fullName,
    bio,
    userId,
  ]);
};

export const insertFollowUser = async (followerId: string , userId: string) => {
  await pool.query("INSERT INTO followers (follower_id, user_id) VALUES ($1, $2)", [
    followerId,
    userId
  ]);

  //* insert notification for each follower
  await pushNotification(userId, followerId, null, NOTIFICATION_FOLLOW);
}

export const deleteFollowUser =  async (followerId: string , userId: string) => {
  await pool.query("DELETE FROM followers WHERE follower_id = $1 AND user_id = $2", [
    followerId,
    userId
  ]);

  //* delete notification for each follower
  await deleteNotification(userId, followerId, NOTIFICATION_FOLLOW);
}


export const getUsersFollowers = async (userId: string) => {
  const result = await pool.query("SELECT * FROM followers WHERE user_id = $1", [userId]);
  return result;
}

export const checkFollowingByID = async (followerId: string , userId: string) => {
  const result = await pool.query("SELECT * FROM followers WHERE follower_id = $1 AND user_id = $2", [followerId, userId])
  if(result.rowCount != null) return (result.rowCount > 0)
}
export const countNoOfPosts = async (userId: string) => {
  const result = await pool.query("SELECT COUNT(*) FROM posts WHERE user_id = $1", [userId]);
  return result.rows[0].count;
}

export const countNoOfFollowers = async (userId: string) => {
  const result = await pool.query("SELECT COUNT(*) FROM followers WHERE follower_id = $1", [userId]);
  return result.rows[0].count;
} 

export const countTotalPopularity = async (userId: string) => {
  const posts = await pool.query("SELECT popularity_score FROM posts WHERE user_id = $1", [userId]);

  let totalPopularity = 0;
  posts.rows.forEach((post: any) => {
    totalPopularity += post.popularity_score;
  });
  return totalPopularity;
} 
