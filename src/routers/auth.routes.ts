import { Router } from "express";
import { login, signup, verifyOtp, verifyToken } from "../controllers/auth.controller";

const router = Router();

router.post("/register", signup);
router.post("/login", login);
router.get("/verify", verifyToken);
router.post('/verifyOtp', verifyOtp)
// router.post('/google', googleLogin)

module.exports = router;
