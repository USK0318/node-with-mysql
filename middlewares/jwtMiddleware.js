const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Bearer token required" });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: "Token not found" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Invalid Token" });
        }

        const decodedId = decoded.id;

        // const [userExists] = await db.query('SELECT * FROM users WHERE id = ?', [decodedId]);
        // if (!userExists || userExists.length === 0) {
        //     return res.status(401).json({ message: "User not found" });
        // }

        // const usertype = userExists[0].usertype;
        // if (usertype !== 'admin') {
        //     return res.status(403).json({ message: "You are not authorized to access this route" });
        // }

        next();
    } catch (error) {
        console.error("Authentication error:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = authenticateToken;
