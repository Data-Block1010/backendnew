"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const authService_1 = require("../services/authService");
// Middleware to authenticate the user based on the token
function authenticate(req, res, next) {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]; // Extract the token from the Authorization header
    if (!token) {
        return res.status(401).json({ message: 'No token provided' }); // Return error if no token
    }
    try {
        const decoded = authService_1.AuthService.verifyToken(token); // Verify the token
        req.user = decoded.userId; // Attach the decoded token (userId) to the request object
        console.log(req.user); // You should now be able to see the console log
        next(); // Call next to pass control to the next middleware or route
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid token' }); // Return error if token verification fails
    }
}
