import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "./dto/register.dto";
import { JwtService } from "@nestjs/jwt";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(Logger)
    public readonly logger: Logger = new Logger(AuthService.name),
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(registerDto: RegisterDto): Promise<object> {
    try {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const user = {
        ...registerDto,
        password: hashedPassword,
      };
      this.logger.warn(
        `Inserindo registro de usuário(name: ${registerDto.name}, email: ${registerDto.email})`,
      );

      await this.userRepository.save(user);

      this.logger.warn(
        `Usuário registrado(name: ${registerDto.name}, email: ${registerDto.email})`,
      );

      return {
        message: "Usuário registrado com sucesso!",
        data: { name: registerDto.name, email: registerDto.email },
      };
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        this.logger.error(
          `Erro ao registrar usuário(name: ${registerDto.name}, email: ${registerDto.email}), pois já existe um email cadastrado.`,
        );
        throw new BadRequestException("Email já cadastrado!");
      }
      throw err;
    }
  }

  async login(email: string, pass: string): Promise<object> {
    try {
      this.logger.warn(`Buscando usuário (email: ${email})`);
      const user = await this.userRepository.findOne({
        where: { email: email },
      });
      const validatePassword = user
        ? await bcrypt.compare(pass, user.password)
        : false;

      if (!user) {
        this.logger.warn(`Usuário não encontrado(email: ${email})`);
        throw new NotFoundException(`Usuário não encontrado(email: ${email})`);
      }

      if (!validatePassword) {
        this.logger.warn("Senha incorreta para usuario: " + email);
        throw new UnauthorizedException("Email ou senha inválido(s).");
      }

      this.logger.warn(`Criando token para o usuário (email: ${email})`);
      const access_token = this.jwtService.sign({ userEmail: email });
      this.logger.warn(`Token criado para o usuário (email: ${email})`);

      return {
        access_token,
        message: "Login realizado com sucesso!",
      };
    } catch (err) {
      this.logger.error(`Erro ao realizar login do usuário (email: ${email})`);
      throw err;
    }
  }
}
