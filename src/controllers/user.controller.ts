import { Request, Response } from "express";
import { insertUserProfilePicture, updateUser } from "../db/user.db";
import fs from "fs";
import pool from "../utils/db";
import cloudinaryConfig from "../config/cloudinary.config";

interface UserPayload extends Request {
  userId?: string;
}

export const updateUserProfilePicture = async (
  req: UserPayload,
  res: Response
) => {
  try {
    const userId = req.userId;
    const profilePicture = req.file;
    if (!profilePicture) {
      return res.status(400).json({
        message: "Please upload a file",
      });
    }

    //? uploading the images/videos/audios to cloudinary
    const results: any = await Promise.resolve(
      cloudinaryConfig.uploader.upload(profilePicture.path, {
        folder: "Trend/avatar",
      })
    );

    //* if there is an error during the uploading of the images/videos/audios then show 400 status code
    if (!results) {
      return res.status(400).json({
        message: "Error uploading memes",
      });
    }

    await insertUserProfilePicture(userId!, results.secure_url);
    return res.status(200).json({
      message: "Profile picture updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({message: "Server error"})
  }
};

export const updateUserData = async (req: UserPayload, res: Response) => {
  try {
    const userId = req.userId;
    const { full_name, bio } = req.body;
    if (!full_name) {
      return res.status(400).json({
        message: "Please enter Full name field",
      });
    }

    await updateUser(userId!, full_name, bio);
    return res.status(200).json({
      message: "User updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({message: "Server error"})
  }
};

export const removeUserProfilePicture = async (
  req: UserPayload,
  res: Response
) => {
  try {
    const userId = req.userId;
    const user = await pool.query(
      "SELECT profile_picture FROM users WHERE id = $1",
      [userId]
    );
    const profilePicture = user.rows[0].profile_picture;

    //? deleting the image from cloudinary
    if (profilePicture) await cloudinaryConfig.uploader.destroy(profilePicture);

    await pool.query("UPDATE users SET profile_picture = $1 WHERE id = $2", [
      null,
      userId,
    ]);
    return res.status(200).json({
      message: "Profile picture removed successfully",
    });
  } catch (error: any) {
    res.status(500).json({message: "Server error"})
  }
};
