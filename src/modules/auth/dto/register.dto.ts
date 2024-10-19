import {
  IsString,
  MinLength,
  Matches,
  IsNumber,
  IsNotEmpty,
  IsEmail,
  IsPositive,
} from "class-validator";

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: "O nome é obrigatório" })
    name: string;

  @IsEmail()
  @IsNotEmpty({ message: "O email é obrigatório" })
    email: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty({ message: "O saldo é obrigatório" })
    balance: number;

  @IsString()
  @MinLength(8, { message: "A senha deve ter no mínimo 8 caracteres" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        "A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial",
    },
  )
    password: string;
}
