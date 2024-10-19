import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

// Configuração do banco
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeOrmConfig } from "./typeorm.config";

// Configuração de middlewares
import { BeforeAllMiddleware } from "./middlewares/before-all.middleware";

// Configuração de controllers
import { AppController } from "./app.controller";

// Configuração de services
import { AppService } from "./app.service";

// Configuração de modules
import { AuthModule } from "./modules/auth/auth.module";
import { TransactionModule } from "./modules/transaction/transaction.module";

// Configuração geral
import { JwtAuthGuard } from "./jwt/jwt-auth.guard";

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtAuthGuard],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BeforeAllMiddleware).forRoutes("*");
  }
}
