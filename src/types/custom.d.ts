// custom.d.ts
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../models/User';
declare global {
  namespace Express {
    interface Request {
      user?:  User;
      userId?:  string;
    }
  }
}
