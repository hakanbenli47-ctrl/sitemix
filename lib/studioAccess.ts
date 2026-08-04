export type StudioManageableProject = {
  management_mode?: string | null;
  payment_status?: string | null;
};

export function canCustomerManageStudioProject(project: StudioManageableProject) {
  if (!project.management_mode) return true;
  return project.management_mode === "monthly" && project.payment_status === "paid";
}

export function studioManagementLockMessage(project: StudioManageableProject) {
  if (project.management_mode === "monthly" && project.payment_status !== "paid") {
    return "Aylık yönetim talebin alındı. Ödeme onaylandığında düzenleme panelin otomatik açılacak.";
  }
  return "Bu site SiteMix tarafından yönetiliyor. Değişiklik taleplerini WhatsApp üzerinden ekibe iletebilirsin.";
}

export function assertCustomerCanManageStudioProject(project: StudioManageableProject) {
  if (!canCustomerManageStudioProject(project)) {
    throw new Error(studioManagementLockMessage(project));
  }
}
