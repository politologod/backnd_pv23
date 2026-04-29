import { Request, Response, NextFunction } from 'express';

const pagination = (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    req.pagination = {
        page,
        limit,
        offset
    };

    next();
};

export default { pagination }; 