import {
  Injectable,
  Logger,
  Inject,
  Request,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { TransactionDto } from "./dto/transaction.dto";

import { JwtService } from "@nestjs/jwt";
import { v4 as uuidv4 } from "uuid";

import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { User } from "../../entities/user.entity";
import { BalanceTransaction } from "../../entities/balanceTransaction.entity";

import { REQUEST } from "@nestjs/core";
import { RefundDto } from "./dto/refund.dto";
import { RefundByProtocolDto } from "./dto/refundByProtocol.dto";

interface Transfer {
  originUserEmail: string;
  targetUserEmail: string;
  amountTransferred: number;
  loggedUserEmail: string;
  transaction?: BalanceTransaction;
  protocol?: string;
  reason?: string;
  id?: number;
}

@Injectable()
export class TransactionService {
  constructor(
    @Inject(Logger)
    public readonly logger: Logger = new Logger(TransactionService.name),
    @Inject(REQUEST) private readonly req: Request,
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BalanceTransaction)
    private readonly transactionRepository: Repository<BalanceTransaction>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createTransaction(transfer: Transfer): Promise<boolean> {
    this.logger.log(
      `Criando transação para a transferência de saldo (to: ${transfer.targetUserEmail}, from: ${transfer.originUserEmail})`,
    );
    if (transfer.id) {
      this.logger.log(
        `A transação é um estorno do protocolo: ${transfer.protocol}`,
      );
      const transactionUpdated = await this.transactionRepository.update(
        transfer.id,
        {
          refundedBy: transfer.loggedUserEmail,
          refundReason: transfer.reason,
          refundedAt: new Date(),
          refunded: true,
        },
      );

      if (!transactionUpdated.affected) {
        throw new InternalServerErrorException(
          "Erro ao realizar o estorno do protocolo: " + transfer.protocol,
        );
      }

      this.logger.log(
        `A transação do protocolo "${transfer.protocol}" foi estornada!`,
      );
      return transactionUpdated.affected === 1;
    }
    await this.transactionRepository.save(transfer);
    this.logger.log(
      `É uma nova transação e o protocolo é: ${transfer.protocol}`,
    );
    return true;
  }

  async balanceTransaction(transfer: Transfer): Promise<object> {
    const {
      loggedUserEmail,
      originUserEmail,
      targetUserEmail,
      amountTransferred,
      id,
      transaction,
    } = transfer;
    const queryRunner = this.dataSource.createQueryRunner();
    this.logger.log(
      "Iniciando 'DataSource Transaction' para realizar transferência de valores.",
    );
    await queryRunner.connect();
    await queryRunner.startTransaction();
    this.logger.log("'DataSource Transaction' iniciado.");
    try {
      this.logger.log("Buscando usuarios no banco.");
      const [user1, user2] = await Promise.all([
        queryRunner.manager.findOne(User, {
          where: { email: originUserEmail },
        }),
        queryRunner.manager.findOne(User, {
          where: { email: targetUserEmail },
        }),
      ]);

      if (!user2) {
        this.logger.error(
          "O usuário de destino informado não está cadastrado!",
        );
        throw new NotFoundException(
          "O usuário de destino informado não está cadastrado!",
        );
      }

      if (!user1.balance) {
        this.logger.error("O usuário não possui nenhum saldo na conta!");
        throw new BadRequestException(
          "O usuário de origem não possui nenhum saldo na conta!",
        );
      }

      if (user1 && user2 && user1.email === user2.email) {
        throw new BadRequestException(
          "O usuário de destino é igual ao de origem!",
        );
      }

      if (Number(user1.balance) < Number(amountTransferred)) {
        this.logger.error(
          `O valor informado(R$${amountTransferred}) é maior do que o disponível na conta! O saldo é de "R$${user1.balance}"`,
        );
        throw new BadRequestException(
          `O valor informado(R$${amountTransferred}) é maior do que o disponível na conta! Seu saldo é de "R$${user1.balance}"`,
        );
      }

      user1.balance = Number(
        (Number(user1.balance) - Number(amountTransferred)).toFixed(2),
      );
      user2.balance = Number(
        (Number(user2.balance) + Number(amountTransferred)).toFixed(2),
      );

      this.logger.log("Iniciando transferência de valores.");
      const protocol = transfer.protocol || uuidv4();
      await Promise.all([
        this.createTransaction({
          protocol: protocol,
          loggedUserEmail,
          originUserEmail: user1.email,
          targetUserEmail: user2.email,
          reason: transfer.reason,
          amountTransferred,
          id: id,
        }),
        queryRunner.manager.save(user1),
        queryRunner.manager.save(user2),
      ]);
      this.logger.log("Valores transferidos com sucesso!");
      this.logger.log("Finalizando 'DataSource Transaction'.");
      await queryRunner.commitTransaction();
      this.logger.log("'DataSource Transaction' finalizado!");
      const isRefund: boolean = id ? true : false;
      let toUser: User = user2;
      let fromUser: User = user1;
      //Situacao 1: deve mostrar o saldo do usuario logado sempre!
      if (isRefund) {
        toUser = transaction.originUserEmail === user1.email ? user1 : user2;
        fromUser = loggedUserEmail === user1.email ? user1 : user2;
      }
      return {
        protocol: protocol,
        message: `Transferência realizada com sucesso para o usuario "${toUser.email}"! Seu novo saldo é de "R$${fromUser.balance}".`,
      };
    } catch (err) {
      this.logger.error(
        "Erro ao realizar transferência de valores, iniciando rollback.",
      );
      await queryRunner.rollbackTransaction();
      this.logger.error("Rollback realizado com sucesso!");
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  getUserEmailByToken(): string {
    this.logger.log("Buscando email do usuário logado");
    const token = this.req.headers["authorization"].split(" ")[1];
    const userEmail = this.jwtService.verify(token).userEmail;
    this.logger.log("Usuário logado: " + userEmail);
    return userEmail;
  }

  async transferBalance(transactionDto: TransactionDto): Promise<object> {
    try {
      const { targetUserEmail, amountToTransfer } = transactionDto;
      const originUserEmail = this.getUserEmailByToken();
      return this.balanceTransaction({
        originUserEmail,
        targetUserEmail,
        amountTransferred: amountToTransfer,
        loggedUserEmail: originUserEmail,
      });
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException(
        "Erro ao realizar transação, por gentileza verifique os dados informados e tente novamente!",
      );
    }
  }

  async refundBalance(refundDto: RefundDto) {
    const { originEmail, targetEmail } = refundDto;
    this.logger.log(
      `Buscando transação no banco para realizar o estorno. usuarios (to: ${targetEmail}, from: ${originEmail})`,
    );
    const transaction = await this.transactionRepository.findOne({
      where: {
        originUserEmail: originEmail,
        targetUserEmail: targetEmail,
        refunded: false,
      },
      order: {
        id: "DESC",
      },
    });
    if (!transaction) {
      throw new NotFoundException(
        "Nenhuma transação passivel de estorno encontrada para os filtros informados!",
      );
    }

    this.logger.log(
      "Transação encontrada, inciando estorno. transactionId: " +
          transaction.id,
    );

    const loggedUserEmail = this.getUserEmailByToken();
    if (
      loggedUserEmail !== transaction.originUserEmail &&
        loggedUserEmail !== transaction.targetUserEmail
    ) {
      throw new UnauthorizedException(
        "O usuário logado não faz parte da transação original!",
      );
    }
    return await this.balanceTransaction({
      transaction,
      ...transaction,
      targetUserEmail: transaction.originUserEmail,
      originUserEmail: transaction.targetUserEmail,
      loggedUserEmail,
      reason: refundDto.refundReason,
    });
  }

  async refundBalanceByProtocol(
    protocol: string,
    refundDto: RefundByProtocolDto,
  ) {
    try {
      this.logger.log(
        "Buscando transação no banco para realizar o estorno. protocolo: " +
          protocol,
      );

      const transaction = await this.transactionRepository.findOne({
        where: { protocol: protocol },
      });
      if (!transaction) {
        throw new NotFoundException(
          "Nenhuma transação passivel de estorno encontrada para os filtros informados!",
        );
      }
      if (transaction.refunded) {
        throw new NotAcceptableException(
          `Transação já foi estornada pelo usuário: ${transaction.refundedBy}`,
        );
      }

      this.logger.log(
        "Transação encontrada, inciando estorno. transactionId: " +
          transaction.id,
      );

      const loggedUserEmail = this.getUserEmailByToken();
      if (
        loggedUserEmail !== transaction.originUserEmail &&
        loggedUserEmail !== transaction.targetUserEmail
      ) {
        throw new UnauthorizedException(
          "O usuário logado não faz parte da transação original!",
        );
      }

      return await this.balanceTransaction({
        transaction,
        ...transaction,
        targetUserEmail: transaction.originUserEmail,
        originUserEmail: transaction.targetUserEmail,
        loggedUserEmail,
        reason: refundDto.refundReason,
      });
    } catch (err) {
      this.logger.error(err);
      if (!err.message) {
        throw new InternalServerErrorException(
          "Erro ao realizar transação, por gentileza verifique os dados informados e tente novamente!",
        );
      }
      throw err;
    }
  }
}
