import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ok } from '../../common/dto/api-response';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return ok(await this.authService.login(dto));
  }
}
