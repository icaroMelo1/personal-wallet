import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RefundDto {
  @IsEmail()
    originEmail: string;

  @IsEmail()
    targetEmail: string;

  @IsString()
  @IsNotEmpty()
    refundReason: string;
}
