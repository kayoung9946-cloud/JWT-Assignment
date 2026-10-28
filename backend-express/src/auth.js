import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ApiError } from "./errors.js";
import { findPublic } from "./users.js";

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const TOKEN_TTL = parseInt(process.env.TOKEN_TTL || "90", 10);

export function issueToken(user) {
  const payload = {
    sub: String(user.id),
    iss: "classroom-board",
    aud: "classroom-board-users",
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: TOKEN_TTL,
  });

  return {
    accessToken,
    expiresIn: TOKEN_TTL,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

export function currentUserId(req) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "TOKEN_REQUIRED", "인증 토큰이 필요합니다.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "classroom-board",
      audience: "classroom-board-users",
    });

    const userId = parseInt(decoded.sub, 10);

    if (!findPublic(userId)) {
      throw new ApiError(401, "INVALID_TOKEN", "존재하지 않는 사용자입니다.");
    }

    return userId;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "TOKEN_EXPIRED", "토큰이 만료되었습니다.");
    }
    throw new ApiError(401, "INVALID_TOKEN", "유효하지 않은 토큰입니다.");
  }
}

export function assertOwner(userId, authorId) {
  if (userId !== authorId) {
    throw new ApiError(403, "FORBIDDEN", "본인이 작성한 글만 수정하거나 삭제할 수 있습니다.");
  }
}