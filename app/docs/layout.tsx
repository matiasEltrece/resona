import { brand } from "@/lib/brand";
import DocsShell from "@/components/DocsShell";

export const metadata = { title: `Documentación — ${brand.name}` };

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
