import pool from "../../utils/db";
import {
  findMemes,
  getPost,
  insertComment,
  insertCommentVote,
  insertVote,
  removeCommentVote,
  removeVote,
  retrieveComments,
  taggerPostToUser,
  updateTotalViewsOfPost,
} from "../../db/post.db";
import { deleteNotification, pushNotification } from "../../db/notification.db";
import {
  NOTIFICATION_COMMENT,
  NOTIFICATION_LIKE,
} from "../../constant/notification.constant";
import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub();

const postResolver = {
  Mutation: {
    castVote: async (
      _: void,
      { postId, userId, vote }: { postId: string; userId: string; vote: number }
    ) => {
      try {
        await insertVote(postId, userId, vote);
        //? step1: find the meme post using post_id para
        const post = await findMemes(postId);

        //? step2: push notification to the post owner
        if (post[0].user_id === userId) return;

        const result = await pushNotification(
          userId,
          post[0].user_id,
          postId,
          NOTIFICATION_LIKE
        );

        // TODO: add live feed notification
        // pubsub.publish("TEST_EVENT", { opFinished: { full_name: "test data" } });
        // console.log(result.rows[0]);

        // pubsub.publish(NOTIFICATION_ADDED, {
        //   newNotification: {
        //     post_id: postId,
        //     created_at: new Date().toISOString(),
        //     notification_type: NOTIFICATION_LIKE,
        //     sender_user: {
        //       id: userId,
        //       username: result.rows[0].username,
        //       full_name: result.rows[0].full_name,
        //       profile_picture: result.rows[0].profile_picture,
        //     },
        //   },
        // });

        return true;
      } catch (err: any) {
        return false;
      }
    },

    discontinueVote: async (
      _: void,
      {
        postId,
        userId,
        value,
      }: { postId: string; userId: string; value: number }
    ) => {
      try {
        await removeVote(postId, userId, value);

        //? get the post owner id
        const post = await findMemes(postId);

        //! remove notification
        await deleteNotification(userId, post[0].user_id, NOTIFICATION_LIKE);

        return true;
      } catch (err: any) {
        return false;
      }
    },

    textComment: async (
      _: void,
      {
        postId,
        userId,
        comment,
      }: { postId: string; userId: string; comment: string }
    ) => {
      try {
        if (comment.split("").length < 1) return false;
        await insertComment(postId, userId, comment);

        // push notification to the post owner
        //? step1: find the meme post using post_id para
        const post = await findMemes(postId);

        //? step2: push notification to the post owner
        if (post[0].user_id === userId) return;

        await pushNotification(
          userId,
          post[0].user_id,
          postId,
          NOTIFICATION_COMMENT
        );

        return true;
      } catch (err: any) {
        return false;
      }
    },

    castCommentVote: async (
      _: void,
      {
        commentId,
        userId,
        vote,
      }: { commentId: string; userId: string; vote: number }
    ) => {
      try {
        await insertCommentVote(commentId, userId, vote);
        return true;
      } catch (err: any) {
        return false;
      }
    },
    discontinueCommentVote: async (
      _: void,
      {
        commentId,
        userId,
        vote,
      }: { commentId: string; userId: string; vote: number }
    ) => {
      try {
        await removeCommentVote(commentId, userId, vote);
        return true;
      } catch (err: any) {
        return false;
      }
    },
    tagPost: async (
      _: void,
      {
        postId,
        userId,
        taggers,
      }: { postId: string; userId: string; taggers: string[] }
    ) => {
      try {
        const { rows } = await pool.query(
          "SELECT * FROM taggers WHERE post_id = $1 AND user_id = $2",
          [postId, userId]
        );

        if (rows.length > 0) return false;
        await taggerPostToUser(postId, userId, taggers);
        return true;
      } catch (err: any) {
        return false;
      }
    },
    taggedPostSeenByUser: async (_: void, { postId }: { postId: string }) => {
      try {
        await updateTotalViewsOfPost(postId);
        return true;
      } catch (err: any) {
        return false;
      }
    },
  },

  Query: {
    getPost: async (
      _: void,
      { id, offset, limit }: { id: string; offset: number; limit: number }
    ) => {
      try {
        const result: any = await getPost(id, offset, limit);
        return result.map((post: any) => ({ ...post, userId: id, limit }));
      } catch (err: any) {
        return [];
      }
    },
    getPostById: async (
      _: void,
      { postId, userId }: { postId: string; userId: string }
    ) => {
      try {
        const result = await pool.query("SELECT * FROM posts WHERE id = $1", [
          postId,
        ]);
        if (result.rows[0] === undefined) return null;
        return { ...result.rows[0], userId };
      } catch (err: any) {}
    },
    getUserPost: async (
      _: void,
      { token, offset, limit }: { token: string; offset: number; limit: number }
    ) => {
      try {
        const userId = token;
        // TODO: add pagination
        const result = await pool.query(
          "SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC OFFSET $2 LIMIT $3",
          [userId, offset, limit]
        );
        return result.rows.map((post: any) => ({ ...post, userId }));
      } catch (err: any) {}
    },
    getComments: async (
      _: void,
      { postId, userId }: { postId: string; userId: string }
    ) => {
      try {
        const comments = await retrieveComments(postId, userId);
        return comments.rows.map((comment: any) => ({ ...comment, userId }));
      } catch (err: any) {
        console.log(err);
      }
    },
    getTaggers: async (
      _: void,
      { postId, userId }: { postId: string; userId: string }
    ) => {
      try {
        const result = await pool.query(
          "SELECT * FROM taggers WHERE post_id = $1 AND user_id = $2",
          [postId, userId]
        );
        return result.rows;
      } catch (err: any) {
        console.log(err);
      }
    },
    searchTopics: async (_: void, { search }: { search: string }) => {
      try {
        // TODO: add pagination
        const result = await pool.query(
          `SELECT * FROM posts WHERE EXISTS (SELECT 1 FROM unnest(post_topics) topic WHERE topic LIKE '%${search}%')`
        );
        return result.rows;
      } catch (err: any) {
        console.log(err);
      }
    },
    getTrendingTopicsWithOnOfMemes: async (_: void) => {
      try {
        const result = await pool.query(`
        SELECT unnest(post_topics) as topic, COUNT(*) as meme_count
        FROM posts
        GROUP BY topic
        ORDER BY meme_count DESC
        `);
        return result.rows;
      } catch (err: any) {
        console.log(err);
      }
    },
  },
  PageInfo: {
    edges: async (posts: any) => {
      return posts;
    },
    hasNextPage: async (posts: any) => {
      return posts.length > 0;
    },
  },
  //TODO: add pagination
  // CommentInfo: {
  //   edges: async (comments: any) => {
  //     return comments.map((comment: any) => ({ ...comment, userId: comment.userId }));
  //   },
  //   hasFetchMore: async (comments: any) => {
  //     console.log(comments.length > 0);
  //     return comments.length > 0;
  //   },
  // },
  Post: {
    user: async (post: any) => {
      try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [
          post.user_id,
        ]);
        return result.rows[0];
      } catch (err: any) {
        console.log(err);
      }
    },
    votes: async (post: any) => {
      try {
        // const userId = await decodeToken(token);
        const result = await pool.query(
          "SELECT * FROM votes WHERE post_id = $1 AND user_id = $2",
          [post.id, post.userId]
        );
        return result.rows;
      } catch (err: any) {
        console.log(err);
      }
    },
    aggregateComments: async (post: any) => {
      try {
        const result = await pool.query(
          "SELECT COUNT(*) FROM comments WHERE post_id = $1",
          [post.id]
        );
        return result.rows[0].count;
      } catch (err: any) {
        return 0;
      }
    },
    tagsBy: async (post: any) => {
      try {
        const result = await pool.query(
          `SELECT * FROM taggers WHERE post_id = $1 AND $2 = ANY(tagged_follower_ids)`,
          [post.id, post.userId]
        );
        return result.rows;
      } catch (err: any) {
        console.log(err);
      }
    },
    totalVotes: async (post: any) => {
      try {
        const result = await pool.query(
          "SELECT COUNT(vote) FROM votes WHERE post_id = $1",
          [post.id]
        );
        return result.rows[0].count;
      } catch (err: any) {
        console.log(err);
      }
    },
  },
  comments: {
    user: async (comment: any) => {
      try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [
          comment.user_id,
        ]);
        return result.rows[0];
      } catch (err: any) {
        console.log(err);
      }
    },
    commentvote: async (comment: any) => {
      try {
        const result = await pool.query(
          "SELECT * FROM commentsvote WHERE comment_id = $1 AND user_id = $2",
          [comment.id, comment.userId]
        );
        return result.rows;
      } catch (err: any) {
        console.log(err);
      }
    },
    votes: async (comment: any) => {
      try {
        const result = await pool.query(
          "SELECT SUM(vote) FROM commentsvote WHERE comment_id = $1",
          [comment.id]
        );
        return result.rows[0].sum !== null ? result.rows[0].sum : 0;
      } catch (err: any) {
        return 0;
      }
    },
  },
  tags: {
    user: async (tag: any) => {
      try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [
          tag.user_id,
        ]);
        return result.rows[0];
      } catch (err: any) {
        console.log(err);
      }
    },
  },
};

export default postResolver;
