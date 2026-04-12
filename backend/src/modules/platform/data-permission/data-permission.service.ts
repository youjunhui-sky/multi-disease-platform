import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DataPermissionRule } from '../../../entities/platform/data-permission-rule.entity';
import { Organization } from '../../../entities/platform/organization.entity';
import { UserRole } from '../../../entities/platform/user-role.entity';
import { User } from '../../../entities/platform/user.entity';

@Injectable()
export class DataPermissionService {
  constructor(
    @InjectRepository(DataPermissionRule)
    private readonly dataRuleRepo: Repository<DataPermissionRule>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * 获取用户可访问的机构ID列表
   * 返回空数组表示有全部权限
   */
  async getUserAccessibleOrgIds(userId: string, userOrgId: string | null): Promise<string[]> {
    // 获取用户所有角色
    const userRoles = await this.userRoleRepo.find({ where: { userId } });
    const roleIds = userRoles.map((ur) => ur.roleId);

    if (roleIds.length === 0) {
      return [];
    }

    // 获取所有角色的数据权限规则
    const rules = await this.dataRuleRepo.find({ where: { roleId: In(roleIds) } });

    if (rules.length === 0) {
      // 没有设置规则，默认只有自己
      if (userOrgId) {
        return [userOrgId];
      }
      return [];
    }

    const orgIdSet = new Set<string>();

    for (const rule of rules) {
      if (rule.scopeType === 'all') {
        // 有任意一个角色是全部权限，返回空数组表示全部
        return [];
      } else if (rule.scopeType === 'dept' && rule.deptIds) {
        // 指定机构
        const deptIds = rule.deptIds.split(',').filter(Boolean);
        deptIds.forEach((id) => orgIdSet.add(id));
      } else if (rule.scopeType === 'dept_and_child' && rule.deptIds) {
        // 本机构及下级
        const deptIds = rule.deptIds.split(',').filter(Boolean);
        for (const deptId of deptIds) {
          // 递归获取所有下级机构
          const childIds = await this.getChildOrgIds(deptId);
          childIds.forEach((id) => orgIdSet.add(id));
          orgIdSet.add(deptId);
        }
      } else if (rule.scopeType === 'self' && userOrgId) {
        // 仅自己机构
        orgIdSet.add(userOrgId);
      }
    }

    return Array.from(orgIdSet);
  }

  /**
   * 递归获取机构及所有下级机构ID
   */
  private async getChildOrgIds(orgId: string): Promise<string[]> {
    const children = await this.orgRepo.find({ where: { parentId: orgId } });
    const allIds: string[] = [];
    for (const child of children) {
      allIds.push(child.id);
      const grandChildIds = await this.getChildOrgIds(child.id);
      allIds.push(...grandChildIds);
    }
    return allIds;
  }
}
