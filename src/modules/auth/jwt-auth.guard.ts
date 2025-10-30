import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }
    const request = context.switchToHttp().getRequest<Request>();

    const authHeader = request.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Bearer token não encontrado');
    }

    return true;
  }
}
