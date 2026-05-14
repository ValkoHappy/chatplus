const ALLOWED_ICON_SETS = new Set(['lucide', 'simple-icons']);

export function safeIconName(value: unknown, fallback = 'lucide:circle') {
  if (typeof value !== 'string') return fallback;

  const icon = value.trim();
  const [set, name] = icon.split(':');

  if (!set || !name) return fallback;
  return ALLOWED_ICON_SETS.has(set) ? icon : fallback;
}
