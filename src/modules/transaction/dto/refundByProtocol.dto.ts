import { IsNotEmpty, IsString } from "class-validator";

export class RefundByProtocolDto {
  @IsString()
  @IsNotEmpty()
    refundReason: string;
}
