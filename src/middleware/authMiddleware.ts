import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

// Middleware to authenticate the user based on the token
export function authenticate(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the Authorization header
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' }); // Return error if no token
    }

    try {
        const decoded = AuthService.verifyToken(token); // Verify the token
        req.user = decoded.userId; // Attach the decoded token (userId) to the request object
        console.log(req.user); // You should now be able to see the console log
        next(); // Call next to pass control to the next middleware or route
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' }); // Return error if token verification fails
    }
}
