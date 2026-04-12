import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataPermissionController } from './data-permission.controller';
import { DataPermissionService } from './data-permission.service';
import { DataPermissionRule } from '../../../entities/platform/data-permission-rule.entity';
import { Organization } from '../../../entities/platform/organization.entity';
import { UserRole } from '../../../entities/platform/user-role.entity';
import { User } from '../../../entities/platform/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DataPermissionRule, Organization, UserRole, User])],
  controllers: [DataPermissionController],
  providers: [DataPermissionService],
  exports: [DataPermissionService],
})
export class DataPermissionModule {}
