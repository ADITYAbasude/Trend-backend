import pool from "../../utils/db";
import {
  checkFollowingByID,
  countNoOfFollowers,
  countNoOfPosts,
  countTotalPopularity,
  deleteFollowUser,
  getUsersFollowers,
  insertFollowUser,
} from "../../db/user.db";

const userResolver = {
  Mutation: {
    handleFollow: async (
      _: void,
      { followerId, userId }: { followerId: string; userId: string }
    ) => {
      try {
        await insertFollowUser(followerId, userId);
        return true;
      } catch (e) {
        return false;
      }
    },
    handleUnfollow: async (
      _: void,
      { followerId, userId }: { followerId: string; userId: string }
    ) => {
      try {
        await deleteFollowUser(followerId, userId);
        return true;
      } catch (e) {
        return false;
      }
    },
  },
  Query: {
    getIdByUsername: async (_: void, { username }: { username: string }) => {
      try {
        const result = await pool.query(
          "SELECT id FROM users WHERE username = $1",
          [username]
        );
        return result.rows[0].id;
      } catch (err) {
        console.log(err);
      }
    },
    getUser: async (
      _: void,
      { yourId, id }: { id: String; yourId: String }
    ) => {
      try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [
          id,
        ]);
        return { ...result.rows[0], userId: yourId };
      } catch (err) {
        console.log(err);
      }
    },

    searchUser: async (
      _: void,
      { search, id }: { search: String; id: string }
    ) => {
      try {
        if (search.split(" ").length == 0) return [];

        const result = await pool.query(
          "SELECT * FROM users WHERE username LIKE $1 OR full_name LIKE $1",
          [`%${search}%`]
        );
        return result.rows.map((post: any) => ({ ...post, userId: id }));
      } catch (err) {
        console.log(err);
      }
    },
    searchFollowerUsers: async (_: void, { id }: { id: string }) => {
      try {
        const result: any = await getUsersFollowers(id);
        return result.rows.map((follower: any) => ({ ...follower }));
      } catch (err: any) {
        console.log(err);
      }
    },
    getTrendingUsers: async (_: void, { id }: { id: string }) => {
      try {
        const result = await pool.query(
          `SELECT users.*, COUNT(votes.id) as total_votes 
           FROM users 
           LEFT JOIN posts ON users.id = posts.user_id
           LEFT JOIN votes ON posts.id = votes.post_id 
           WHERE users.id != $1 
           GROUP BY users.id 
           ORDER BY total_votes DESC 
           LIMIT 5`,
          [id]
        );
        return result.rows.map((post: any) => ({ ...post, userId: id }));
      } catch (err: any) {
        console.log(err);
      }
    },
  },
  User: {
    Following: async (user: any) => {
      const result = await checkFollowingByID(user.id, user.userId);
      return result;
    },
    totalMemes: async (user: any) => {
      return await countNoOfPosts(user.id);
    },
    totalFollowers: async (user: any) => {
      return await countNoOfFollowers(user.id);
    },
    totalPopularity: async (user: any) => {
      return await countTotalPopularity(user.id);
    },
  },
  Follower: {
    User: async (user: any) => {
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [
        user.follower_id,
      ]);
      return result.rows[0];
    },
    // TODO:
    // Following: async (user: any) => {
    //   const result = await checkFollowingByID(user.id, user.userId);
    //   return result;
    // },
  },
};

export default userResolver;
