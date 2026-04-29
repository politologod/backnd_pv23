import { IUser } from '../models';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      id?: string | string[];
      _startTime?: number;
    }
  }
}
