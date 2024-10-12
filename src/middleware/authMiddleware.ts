// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Extend the Request interface to include user
interface AuthenticatedRequest extends Request {
    user?: string | JwtPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Assuming Bearer token
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Ensure decoded is an object and has userId
        if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
            req.user = decoded.userId; // Set userId to req.user
            next();
        } else {
            return res.status(401).json({ message: 'Invalid token payload' });
        }
    });
};
