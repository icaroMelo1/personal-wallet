import { IsNotEmpty, IsEmail, IsNumber, IsPositive } from "class-validator";

export class TransactionDto {
  @IsNotEmpty({
    message: "Informe o email de destino! " + "targetEmail:email@destino.com",
  })
  @IsEmail()
    targetUserEmail: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
    amountToTransfer: number;
}
