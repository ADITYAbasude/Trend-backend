import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface UserPayload extends Request {
  userId?: string;
}

const decodeUserId = async (
  req: UserPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.header("authorization")?.split(" ")[1];
    if (id) {
      try {
        const userId = jwt.verify(id, process.env.JWT_SECRET_KEY!);
        req.userId = (userId as JwtPayload).userId;
      } catch (err) {
        console.log("Invalid token");
      }
    }
    next();
  } catch (err: any) {
    console.log(err.message);
  }
};

export { decodeUserId };
