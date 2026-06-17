import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminRoleGuard } from './guards/admin-role.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET', 'dev_change_me');
        if (
          configService.get<string>('NODE_ENV') === 'production' &&
          (!secret || secret === 'dev_change_me' || secret.length < 32)
        ) {
          throw new Error(
            'JWT_SECRET must be configured with at least 32 characters in production',
          );
        }

        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30d'),
          },
        };
      },
    }),
  ],
  providers: [JwtAuthGuard, OptionalJwtAuthGuard, AdminRoleGuard],
  exports: [JwtModule, JwtAuthGuard, OptionalJwtAuthGuard, AdminRoleGuard],
})
export class AuthModule {}
