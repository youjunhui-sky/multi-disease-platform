import { request } from './request'

export const dataPermissionApi = {
  /**
   * 获取当前用户可访问的机构ID列表
   * 返回空数组表示有全部权限
   */
  getAccessibleOrgs() {
    return request.get<string[]>('/data-permission/accessible-orgs')
  }
}
