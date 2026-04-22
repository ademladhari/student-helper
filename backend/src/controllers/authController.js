import crypto from "crypto";
import { User } from "../models/User.js";

const PASSWORD_KEY_LENGTH = 64;
const TOKEN_TTL_DAYS = 30;

function getAuthSecret() {
  return process.env.AUTH_SECRET || "student-helper-dev-secret";
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH, {
    N: 16384,
    r: 8,
    p: 1,
  }).toString("hex");
}

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);

  return { salt, passwordHash };
}

function verifyPassword(password, salt, passwordHash) {
  const computedHash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(passwordHash, "hex"));
}

function createToken(user) {
  const issuedAt = Date.now().toString();
  const expiresAt = (Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toString();
  const payload = `${user._id}:${user.email}:${issuedAt}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function signUp(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }

    const { salt, passwordHash } = createPasswordRecord(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      passwordSalt: salt,
    });

    return res.status(201).json({
      user: safeUser(user),
      token: createToken(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function signIn(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      user: safeUser(user),
      token: createToken(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userId, email, issuedAt, expiresAt, signature] = decoded.split(":");

    if (!userId || !email || !issuedAt || !expiresAt || !signature) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const payload = `${userId}:${email}:${issuedAt}:${expiresAt}`;
    const expectedSignature = crypto
      .createHmac("sha256", getAuthSecret())
      .update(payload)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (Number(expiresAt) < Date.now()) {
      return res.status(401).json({ message: "Token expired" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: safeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}