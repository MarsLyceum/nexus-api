import 'express';

declare module 'express' {
  interface Request {
    auth?: unknown; // You can replace 'any' with a more specific type if known
  }
}
