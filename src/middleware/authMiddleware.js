"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    var _a;
    const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1]; // Assuming Bearer token
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Ensure decoded is an object and has userId
        if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
            req.user = decoded.userId; // Set userId to req.user
            next();
        }
        else {
            return res.status(401).json({ message: 'Invalid token payload' });
        }
    });
};
exports.authenticate = authenticate;
