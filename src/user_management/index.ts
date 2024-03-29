import jwt from "jsonwebtoken";

import { User } from "./User";

// Function to generate JWT
const generateJWT = (userId: string): string => {
  // Secret key for signing JWT - should be kept secure and private
  const secretKey = "your_secret_key_here";

  // JWT payload
  const payload = {
    userId,
    // Add any other user/session data required
  };

  // Sign the token with a 1 day expiration
  const token = jwt.sign(payload, secretKey, {
    expiresIn: "1d", // Token expires in 1 day
  });

  return token;
};

// Example usage
const userId = "123";
const token = generateJWT(userId);
console.log(token);
