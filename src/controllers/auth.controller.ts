import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../utils/db";
import { decodeToken } from "../utils/token.decode.util";
import { sendEmail } from "../utils/email.util";
import { insertNewUser } from "../db/user.db";

export const signup = async (req: Request, res: Response) => {
  try {
    const { mailId, fullName, username, password } = req.body;

    //* check if all fields are provided
    if (
      !mailId.trim() ||
      !fullName.trim() ||
      !username.trim() ||
      !password.trim()
    ) {
      return res.status(400).send({ message: "All fields are required" });
    }
    //* check if mobile number is valid
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mailId))
      return res.status(400).json({ message: "Invalid mail address" });

    const mailExits = await pool.query(
      "SElECT * FROM users WHERE mail_id = $1",
      [mailId]
    );
    if (mailExits.rows.length > 0)
      return res.status(409).json({ message: "Mail id already exist" });

    const usernameExits = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (usernameExits.rows.length > 0)
      return res.status(409).json({ message: "Username already exists" });

    // generate otp and send it to the mail
    const otp = Math.floor(1000 + Math.random() * 9000);

    const hashOtp = await bcrypt.hash(otp.toString(), 10);

    await pool.query("DELETE FROM otp WHERE mail_id = $1", [mailId]);
    await pool.query("INSERT INTO otp (mail_id, otp) VALUES ($1, $2)", [
      mailId,
      hashOtp,
    ]);

    const hashPassword = await bcrypt.hash(password, 10);

    //* Insert a new user
    await insertNewUser(mailId, fullName, username, hashPassword);

    sendEmail(
      mailId,
      "Welcome to Trend",
      `Your otp is ${otp} it is valid for only 2 minutes.`
    ).then((data: any) => {
      res.status(200).json("Otp sent successfully");
    });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { otp, mailId } = req.body;

    // const { mailId } = req.body;
    // const { fullName, username, password } = req.body;
    if (!otp || !mailId)
      return res.status(400).json({ message: "All fields are required" });

    let otpMatch: any = await pool.query(
      "SELECT * FROM otp WHERE mail_id = $1",
      [mailId]
    );

    otpMatch = jwt.decode(otpMatch.rows[0].otp);

    if (otpMatch === otp)
      return res.status(401).json({ message: "Invalid otp" });

    const user = await pool.query("SELECT id FROM users WHERE mail_id = $1", [
      mailId,
    ]);

    req.body.userId = user.rows[0].id;
    const token = jwt.sign(
      { userId: req.body.userId },
      process.env.JWT_SECRET_KEY!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.json({ message: "Register successful", token });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { mailId, password } = req.body;

    //* check if all fields are provided
    if (!mailId || !password)
      return res.status(400).json({ message: "All fields are required" });

    //* check if mobile number is valid
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mailId))
      return res.status(400).json({ message: "Invalid email address" });

    //* check if mobile number exists, if exists then get the password
    const mailExits: any = await pool.query(
      "SELECT id , password FROM users WHERE mail_id = $1",
      [mailId]
    );

    if (mailExits.rows.length === 0)
      return res.status(409).json({ message: "Email address does not exists" });

    //* mailExits.rows[0].password is the hashed password
    const passwordMatch = await bcrypt.compare(
      password,
      mailExits.rows[0].password
    );
    if (!passwordMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    req.body.userId = mailExits.rows[0].id;
    const token = jwt.sign(
      { userId: req.body.userId },
      process.env.JWT_SECRET_KEY!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.json({ message: "Login successful", token });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// export const googleLogin = async (req: Request, res: Response) => {
//   const { code } = req.body;

//   console.log(code);
//   const ticket = await verifyGoogleIdToken(code);
//   const { name, email, sub } = ticket.getPayload() as any;
//   const defaultUsername = name.replace(/ /g, "").toLowerCase();

// }

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const encodedToken = req.header("authorization") as string;
    const token = req.header("authorization")?.split(" ")[1];

    if (!token || token == undefined)
      return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, process.env.JWT_SECRET_KEY!, async (err) => {
      if (err) {
        return res.status(403).json({ valid: false, message: "Invalid token" });
      } else {
        const id = await decodeToken(encodedToken);
        res.json({ message: "Token is valid", valid: true, id });
      }
    });
  } catch (error: any) {
    res.json({message: "Server error"})
  }
};
