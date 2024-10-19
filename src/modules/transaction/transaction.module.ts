import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";

import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../../jwt/jwt.strategy";

import { TransactionService } from "./transaction.service";
import { TransactionController } from "./transaction.controller";
import { User } from "../../entities/user.entity";
import { BalanceTransaction } from "src/entities/balanceTransaction.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, BalanceTransaction]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.SECRET || "S3creT_K37",
      signOptions: { expiresIn: "30m" },
    }),
  ],
  providers: [TransactionService, JwtStrategy, Logger],
  controllers: [TransactionController],
  exports: [TransactionService],
})
export class TransactionModule {}
