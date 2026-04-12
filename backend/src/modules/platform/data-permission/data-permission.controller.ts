import { Controller, Get, Req } from '@nestjs/common';
import { DataPermissionService } from './data-permission.service';

@Controller('data-permission')
export class DataPermissionController {
  constructor(private readonly dataPermissionService: DataPermissionService) {}

  /**
   * 获取当前用户可访问的机构ID列表
   * 返回空数组表示有全部权限，非空数组表示受限
   */
  @Get('accessible-orgs')
  async getAccessibleOrgs(@Req() req: any) {
    const userId = req.user?.sub;
    const orgId = req.user?.orgId || null;
    if (!userId) {
      return [];
    }
    const orgIds = await this.dataPermissionService.getUserAccessibleOrgIds(userId, orgId);
    return orgIds;
  }
}
