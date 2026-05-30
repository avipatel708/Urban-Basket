import jwt from "jsonwebtoken"

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "urban-basket-jwt-secret-key-2026-production")
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }
    
    next()
  } catch (err) {
    console.error("JWT Verification Error:", err.message)
    return res.status(401).json({ error: "Invalid or expired token." })
  }
}

export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized." })
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." })
    }
    next()
  }
}
