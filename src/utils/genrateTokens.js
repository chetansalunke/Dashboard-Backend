import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const generateAccessToken = (user) => {
  console.log("From the genrate access token");
  console.log(user.id);
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "5m" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.REFRESS_TOKEN_SECRETE, {
    expiresIn: "7d",
  });
};
