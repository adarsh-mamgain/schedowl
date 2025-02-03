export function generateUniqueSlug(name: string): string {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}
