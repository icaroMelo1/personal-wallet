import { Controller, Post, Body, UseGuards, Param } from "@nestjs/common";
import { JwtAuthGuard } from "../../jwt/jwt-auth.guard";
import { TransactionService } from "./transaction.service";
import { TransactionDto } from "./dto/transaction.dto";
import { RefundDto } from "./dto/refund.dto";
import { RefundByProtocolDto } from "./dto/refundByProtocol.dto";

@UseGuards(JwtAuthGuard)
@Controller("transaction")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async getTransaction(@Body() transactionDto: TransactionDto) {
    return await this.transactionService.transferBalance(transactionDto);
  }

  @Post("refund")
  async refundBalance(@Body() refundDto: RefundDto) {
    return await this.transactionService.refundBalance(refundDto);
  }

  @Post("refund/:id")
  async refundBalanceByProtocol(
    @Body() refundDto: RefundByProtocolDto,
    @Param("id") protocol: string,
  ) {
    return await this.transactionService.refundBalanceByProtocol(
      protocol,
      refundDto,
    );
  }
}
