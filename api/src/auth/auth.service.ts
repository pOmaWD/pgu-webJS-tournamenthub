import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { Role, UserDocument } from '../users/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // bcrypt учитывает только первые 72 БАЙТА (кириллица = 2 байта на символ)
    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new BadRequestException('Пароль слишком длинный (максимум 72 байта)');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      displayName: dto.displayName,
      email: dto.email.trim().toLowerCase(),
      passwordHash,
      role: Role.CAPTAIN, // обычная роль; остальные роли только через seed
    });
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    const ok =
      user && user.active && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!ok) {
      // одно и то же сообщение для неверного email и неверного пароля
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return this.issueToken(user);
  }

  private issueToken(user: UserDocument) {
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    return {
      accessToken,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    };
  }
}