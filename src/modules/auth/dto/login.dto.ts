import { IsString, IsNotEmpty } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: "O email é obrigatório" })
    email: string;

  @IsString()
  @IsNotEmpty({ message: "A senha é obrigatório" })
    password: string;
}
