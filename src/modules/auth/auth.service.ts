import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { Payload } from './types/payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(emailUsername: string, password: string) {
    const user = await this.usersService.findByEmail(emailUsername);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const payload: Payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(
      { ...payload, type: 'access' },
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    await this.usersService.saveRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    let payload: Payload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('refresh token inválido');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Tipo de token inválido');
    }

    const userId = payload.sub;
    const storedToken = await this.usersService.getRefreshToken(userId);

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newPayload: Payload = {
      sub: user.id,
      email: user.email,
    };

    const newAccessToken = this.jwtService.sign(
      { ...newPayload, type: 'access' },
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
    const newRefreshToken = this.jwtService.sign(
      { ...newPayload, type: 'refresh' },
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    await this.usersService.saveRefreshToken(user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
