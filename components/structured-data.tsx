import { canonicalOrigin } from '@/lib/refresh';

export function StructuredData({ value }: { value: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(value).replaceAll('<', '\\u003c') }} />;
}
export function BreadcrumbData({ name, path, parent }: { name: string; path: string; parent?: { name: string; path: string } }) {
  const items = [{ name: 'Midterm Watch', path: '/' }, ...(parent ? [parent] : []), { name, path }];
  return <StructuredData value={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: canonicalOrigin + item.path })) }} />;
}
