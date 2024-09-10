// src/types/express.d.ts
import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: any; // Define the type of `user` according to your needs
        }
    }
}
