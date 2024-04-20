

import multer from "multer";
import { decodeUserId } from "../middleware/user.middleware";
import { deleteMeme, postMeme } from "../controllers/post.controller";
import { Router } from "express";

const router = Router();

const uploader = multer({
    storage: multer.diskStorage({})
})

router.use(decodeUserId);
router.post("/create", uploader.array("files", 2), postMeme);
router.delete("/delete/:postId" , deleteMeme);

module.exports = router;
