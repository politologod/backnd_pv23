/**
 * Global type declarations for modules without types
 * and Express request augmentation
 */

// Augment Express Request to include custom properties
import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: string;
        [key: string]: any;
      };
      id?: string;
      pagination?: {
        page: number;
        limit: number;
        offset: number;
      };
      file?: any;
      files?: any[];
      connection?: any;
      _startTime?: number;
    }
  }
}

// Declare modules that don't have type declarations
declare module 'swagger-jsdoc' {
  const swaggerJsdoc: any;
  export default swaggerJsdoc;
}

declare module 'swagger-ui-express' {
  const swaggerUi: any;
  export default swaggerUi;
}

declare module 'multer' {
  const multer: any;
  export default multer;
}

export {};
