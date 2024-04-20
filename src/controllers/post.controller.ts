import { Request, Response } from "express";
import { findMemes, insertMeme, removeMeme } from "../db/post.db";
import cloudinaryConfig from "../config/cloudinary.config";

interface UserPayload extends Request {
  userId?: string;
}

export const postMeme = async (req: UserPayload, res: Response) => {
  try {
    const userId = req.userId;
    const { caption, postTopics } = req.body;
    const memes: any = req.files;
    let memePaths: string[] = [];
    
    if (memes.length > 0 || caption) {
      if (memes && memes.length > 0) {
        //? uploading the images/videos/audios to cloudinary
        const results: any = await Promise.all(
          memes.map((file: any) =>
            cloudinaryConfig.uploader.upload(file.path, {
              resource_type: "auto",
              folder: "Trend/memes",
            })
          )
        );

        //* if there is an error during the uploading of the images/videos/audios then return the error
        if (!results) {
          return res.status(400).json({
            message: "Error during uploading the meme",
          });
        }

        results?.map((result: any) => {
          memePaths.push(result.secure_url);
        });
      }

      //* inserting the meme in the database
      await insertMeme(userId!, caption, memePaths, postTopics);
    } else {
      return res.status(400).json({
        message: "Write some caption or upload some memes",
      });
    }
    return res.status(200).json({
      message: "Post uploaded successfully",
    });
  } catch (error: any) {
    res.status(500).json({message: "Server error"})
  }
};

export const deleteMeme = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const post = await findMemes(postId);
    if (!post) {
      return res.status(400).json({
        message: "Post not found",
      });
    }
    if (
      post[0].meme_path != null &&
      post[0].meme_path.length > 0 &&
      post[0].meme_path != undefined
    ) {
      post[0].meme_path.map(async (path: string) => {
        await cloudinaryConfig.uploader.destroy(path);
      });
    }
    await removeMeme(postId);
    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({message: "Server error"})
  }
};
