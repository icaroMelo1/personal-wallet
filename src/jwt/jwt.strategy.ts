import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Injectable } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET || "S3creT_K37",
    });
  }

  async validate(payload: { userEmail: string }) {
    const userEmail = payload.userEmail;
    // Caso sejá necessário buscar o usuario em algum momento no banco, aqui seria o ideal
    return { userEmail };
  }
}
