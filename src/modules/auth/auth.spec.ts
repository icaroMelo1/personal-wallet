import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../../entities/user.entity";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import {
  BadRequestException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

describe("AuthService", () => {
  let authService: AuthService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockUserRepository = {
    create: jest.fn().mockImplementation((user) => user),
    save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue("mocked_token"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should successfully register a user", async () => {
      const registerDto: RegisterDto = {
        name: "Test User",
        email: "test@example.com",
        password: "P0w3rfullP@ssword!",
        balance: 100,
      };

      const result: object = await authService.register(registerDto);

      expect(result).toEqual({
        message: "Usuário registrado com sucesso!",
        data: { name: registerDto.name, email: registerDto.email },
      });

      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it("should register a user and throw BadRequestException if email is already registered", async () => {
      const registerDto: RegisterDto = {
        name: "Test User",
        email: "test@example.com",
        password: "P0w3rfullP@ssword!",
        balance: 100,
      };

      const firstResult: object = await authService.register(registerDto);

      expect(firstResult).toEqual({
        message: "Usuário registrado com sucesso!",
        data: { name: registerDto.name, email: registerDto.email },
      });

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);

      jest
        .spyOn(mockUserRepository, "save")
        .mockRejectedValueOnce({ code: "ER_DUP_ENTRY" });

      await expect(authService.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe("login", () => {
    it("should return an access token for valid credentials", async () => {
      const email: string = "test@example.com";
      const password: string = "P0w3rfullP@ssword!";

      const user: User = {
        email,
        password: await bcrypt.hash(password, 10),
      } as User;

      jest.spyOn(mockUserRepository, "findOne").mockResolvedValue(user);

      const result: object = await authService.login(email, password);

      expect(mockJwtService.sign).toHaveBeenCalledWith({ userEmail: email });

      expect(result).toEqual({
        access_token: "mocked_token",
        message: "Login realizado com sucesso!",
      });
    });

    it("should throw NotFoundException for invalid email", async () => {
      const email: string = "test@example.com";
      const password: string = "wrong_password";

      jest.spyOn(mockUserRepository, "findOne").mockResolvedValue(null);

      await expect(authService.login(email, password)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw UnauthorizedException for invalid credentials", async () => {
      const email: string = "test@example.com";
      const password: string = "P0w3rfullP@ssword!";
      const wrongPassword: string = "wrong_password";

      const user: User = {
        email,
        password: await bcrypt.hash(password, 10),
      } as User;

      jest.spyOn(mockUserRepository, "findOne").mockResolvedValue(user);

      await expect(authService.login(email, wrongPassword)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
