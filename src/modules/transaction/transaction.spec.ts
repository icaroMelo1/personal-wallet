import { Test, TestingModule } from "@nestjs/testing";
import { TransactionService } from "./transaction.service";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../../entities/user.entity";
import { BalanceTransaction } from "../../entities/balanceTransaction.entity";
import { DataSource } from "typeorm";
import { REQUEST } from "@nestjs/core";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { TransactionDto } from "./dto/transaction.dto";
import { RefundDto } from "./dto/refund.dto";

describe("TransactionService", () => {
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockUsers = [
    { email: "loggedUser@example.com", balance: 200 },
    { email: "target@example.com", balance: 500 },
  ];

  const mockTransactions = [
    {
      id: 1,
      originUserEmail: "loggedUser@example.com",
      targetUserEmail: "target@example.com",
      protocol: uuidv4(),
      amountTransferred: 100,
      refunded: false,
    },
    {
      id: 2,
      originUserEmail: "origin@example.com",
      targetUserEmail: "target@example.com",
      protocol: uuidv4(),
      amountTransferred: 100,
      refunded: false,
    },
  ];

  const mockUserRepository = {
    findOne: jest.fn().mockImplementation((options) => {
      return Promise.resolve(
        mockUsers.find((user) => user.email === options.where.email) || null,
      );
    }),
    save: jest.fn(),
  };

  const mockTransactionRepository = {
    findOne: jest.fn().mockImplementation((options) => {
      return Promise.resolve(
        mockTransactions.find((t) => {
          const { protocol, targetUserEmail, originUserEmail } = options.where;
          if (t.protocol === protocol) return t;
          if (
            t.originUserEmail === originUserEmail &&
            t.targetUserEmail === targetUserEmail
          )
            return t;
        }) || null,
      );
    }),
    save: jest.fn(),
    update: jest.fn().mockImplementation(() => {
      return { affected: 1 };
    }),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn().mockImplementation((entity, options) => {
          return Promise.resolve(
            mockUsers.find((user) => user.email === options.where.email) ||
              null,
          );
        }),
        save: jest.fn(),
      },
    }),
  };

  const mockJwtService = {
    verify: jest.fn().mockReturnValue({ userEmail: "loggedUser@example.com" }),
  };

  const mockRequest = {
    headers: {
      authorization: "Bearer mocked_token",
    },
  };

  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(BalanceTransaction),
          useValue: mockTransactionRepository,
        },
        { provide: REQUEST, useValue: mockRequest },
        { provide: Logger, useValue: mockLogger },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("transferBalance", () => {
    it("should successfully transfer balance", async () => {
      const transactionDto: TransactionDto = {
        targetUserEmail: "target@example.com",
        amountToTransfer: 100,
      };

      const result: object = await service.transferBalance(transactionDto);

      expect(result).toHaveProperty("protocol");
      expect(
        mockDataSource.createQueryRunner().manager.save,
      ).toHaveBeenCalledTimes(2);
    });

    it("should throw an error when amount is greater than balance", async () => {
      const transactionDto: TransactionDto = {
        targetUserEmail: "target@example.com",
        amountToTransfer: 300,
      };

      await expect(service.transferBalance(transactionDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw NotFoundException if target user does not exist", async () => {
      const transactionDto: TransactionDto = {
        targetUserEmail: "nonexistent@example.com",
        amountToTransfer: 100,
      };

      await expect(service.transferBalance(transactionDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("refundBalance", () => {
    it("should successfully refund balance", async () => {
      const refundDto: RefundDto = {
        originEmail: "loggedUser@example.com",
        targetEmail: "target@example.com",
        refundReason: "Mistaken transfer",
      };

      const result = await service.refundBalance(refundDto);

      expect(result).toHaveProperty("protocol");
      expect(mockTransactionRepository.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException if transaction not found", async () => {
      const refundDto: RefundDto = {
        originEmail: "loggedUser@example.com",
        targetEmail: "targetUser@example.com",
        refundReason: "Mistaken transfer",
      };

      await expect(service.refundBalance(refundDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw UnauthorizedException if user is not part of the transaction", async () => {
      const refundDto: RefundDto = {
        originEmail: "origin@example.com",
        targetEmail: "target@example.com",
        refundReason: "Mistaken transfer",
      };

      await expect(service.refundBalance(refundDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("refundBalanceByProtocol", () => {
    it("should successfully refund balance by protocol", async () => {
      const refundDto = { refundReason: "Mistaken transfer" };
      const protocol = uuidv4();

      const mockTransaction = {
        id: 3,
        protocol,
        originUserEmail: "loggedUser@example.com",
        targetUserEmail: "target@example.com",
        refunded: false,
        amountTransferred: 100,
      };
      mockTransactions.push(mockTransaction);

      const result = await service.refundBalanceByProtocol(protocol, refundDto);

      expect(result).toHaveProperty("protocol");
      expect(mockTransactionRepository.update).toHaveBeenCalledWith(
        mockTransaction.id,
        expect.anything(),
      );
    });

    it("should throw NotFoundException if transaction by protocol not found", async () => {
      const refundDto = { refundReason: "Mistaken transfer" };
      const protocol = uuidv4();

      await expect(
        service.refundBalanceByProtocol(protocol, refundDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw UnauthorizedException if user is not part of the transaction", async () => {
      const refundDto = { refundReason: "Mistaken transfer" };
      const protocol = uuidv4();

      const mockTransaction = {
        id: 4,
        protocol,
        originUserEmail: "origin@example.com",
        targetUserEmail: "target@example.com",
        refunded: false,
        amountTransferred: 100,
      };
      mockTransactions.push(mockTransaction);

      await expect(
        service.refundBalanceByProtocol(protocol, refundDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
