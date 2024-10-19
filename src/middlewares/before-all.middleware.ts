import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class BeforeAllMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Caso queira adicionar lógica antes de todas as requisições
    next();
  }
}
