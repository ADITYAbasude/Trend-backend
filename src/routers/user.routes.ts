import { Router } from "express";
import multer from "multer";
import {
  removeUserProfilePicture,
  updateUserData,
  updateUserProfilePicture,
} from "../controllers/user.controller";
import { decodeUserId } from "../middleware/user.middleware";


const uploader = multer({
  storage: multer.diskStorage({})
})


const router = Router();
router.use(decodeUserId);
router.post(
  "/update/avatar",
  uploader.single("avatar"),
  updateUserProfilePicture
);
router.post("/update/profile", updateUserData);
router.delete("/remove/avatar", removeUserProfilePicture);

module.exports = router;
