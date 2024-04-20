import jwt, { JwtPayload } from "jsonwebtoken";

export const decodeToken = async (id: string): Promise<string | undefined> => {
  const decoded = await new Promise<JwtPayload | string>((resolve, reject) => {
    jwt.verify(
      id.split(" ")[1],
      process.env.JWT_SECRET_KEY!,
      (err, decoded) => {
        if (err) {
          if (err.name == "TokenExpiredError") reject("Token expired");
          else reject(err);
        } else {
            resolve(decoded!);
            return decoded;
        }
      }
    );
  });

  if (typeof decoded === "object" && "userId" in decoded) return decoded.userId;
};
