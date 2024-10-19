import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";

import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../../jwt/jwt.strategy";

import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { User } from "../../entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.SECRET || "S3creT_K37",
      signOptions: { expiresIn: "30m" },
    }),
  ],
  providers: [AuthService, JwtStrategy, Logger],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
