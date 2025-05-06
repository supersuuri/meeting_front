import jwt from "jsonwebtoken";

export function verifyToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET || "14e7f672013f215f4b9f20dfb6280c29acf1832724e2e966fdb08bb368f0e20ddfd801d317f3edfe5a0ef3e55c722907359facec840c69b7f79bceb9a3ad6a205da827defe23b560ed183ef65f323d45c1cf60f6328596b0a5fe6df466d91973872009956744298c019d7b3395fbdf244da2c1335c3ef26de7b2a667fdb6691d0c7a66b8aefb18750b6cbf936be2e1bba0439c53d064485f7b968184892f138648a34e971942b970b71d8228af9a1c94086b569f97e67e924a530b7aaf0f30ff1d1e31b169ad2bf04eb6fd7eecc07a3ea1bf7c89d74ccaaa77e7ec2f1a0a5f899720d6a851fd22321419551e6bccaf94fe6ef237465067156213b501d6ca6241";
    const decoded = jwt.verify(token, secret);

    // Ensure we're returning the data in a consistent format
    // If decoded is an object with an id property, return it directly
    if (decoded && typeof decoded === "object" && "id" in decoded) {
      // Make sure the ID is a string to avoid format issues
      return {
        id: String(decoded.id),
      };
    }

    throw new Error("Invalid token format");
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
}
