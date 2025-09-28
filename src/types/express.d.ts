import { Request as ExpressRequest } from 'express';

declare module 'express' {
  export interface Request extends ExpressRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      locationId?: string;
    };
  }
}