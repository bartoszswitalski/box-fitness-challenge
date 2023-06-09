import { Training, User } from '@box-fc/shared/types';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminGuard } from './admin/admin.guard';
import { JwtGuard } from './jwt/jwt.guard';

@Module({
    imports: [TypeOrmModule.forFeature([User, Training])],
    exports: [AdminGuard, JwtGuard],
})
export class GuardsModule {}
