// src/types/express.d.ts
import { Request } from 'express';

interface User {
    id: string; // or whatever properties your user object has
    username: string;
    // Add other properties as needed
}

declare global {
    namespace Express {
        interface Request {
            user?: User; // Use the User type instead of any
        }
    }
}
