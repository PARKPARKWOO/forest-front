import axiosInstance from '../axiosInstance';
import { ORGANIZATION_WRITES_ENABLED } from '../config/organizationDeployment';
import { parseOrganizationSnapshot } from '../utils/organizationDirectory';

export async function getPublicOrganizationDirectory() {
  const response = await axiosInstance.get('/organization');
  return parseOrganizationSnapshot(response.data?.data, { managed: false });
}

export async function getManagedOrganizationDirectory() {
  const response = await axiosInstance.get('/organization/manage');
  return parseOrganizationSnapshot(response.data?.data, { managed: true });
}

export async function updateManagedOrganizationDirectory(request) {
  if (!ORGANIZATION_WRITES_ENABLED) {
    const error = new Error('조직도 저장은 현재 미리보기에서 비활성화되어 있습니다.');
    error.code = 'ORGANIZATION_WRITES_DISABLED';
    throw error;
  }
  const response = await axiosInstance.put('/organization/manage', request);
  return parseOrganizationSnapshot(response.data?.data, { managed: true });
}
