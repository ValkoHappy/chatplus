export function getPageV2MigrationGateErrors(data: Record<string, unknown>) {
  if (data.migration_ready !== true) {
    return [];
  }

  const errors: string[] = [];

  if (data.editorial_status !== 'approved') {
    errors.push('migration_ready can be enabled only when editorial_status is approved.');
  }

  if (data.parity_status !== 'approved') {
    errors.push('migration_ready can be enabled only when parity_status is approved.');
  }

  const legacyTemplateFamily = typeof data.legacy_template_family === 'string' ? data.legacy_template_family.trim() : '';
  if (!legacyTemplateFamily) {
    errors.push('migration_ready requires legacy_template_family.');
  }

  const layoutSignature = data.legacy_layout_signature;
  if (!layoutSignature || typeof layoutSignature !== 'object' || Array.isArray(layoutSignature)) {
    errors.push('migration_ready requires legacy_layout_signature.');
  }

  return errors;
}
