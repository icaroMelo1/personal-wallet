import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as dotenv from "dotenv";
dotenv.config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: "mysql",
  host: process.env.TYPEORM_HOST,
  port: parseInt(process.env.TYPEORM_PORT),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  //   entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  // entities: ['/../**/*.entity{.ts,.js}'],
  entities: [
    process.env.NODE_ENV === "development"
      ? "./src/entities/**/*.entity.ts"
      : "./dist/**/*.entity.js",
  ],

  // entities: ['./entities/transaction.entity.ts', './entities/user.entity.ts'],
  synchronize: process.env.TYPEORM_SYNCHRONIZE === "true",
};
