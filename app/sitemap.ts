import type { MetadataRoute } from "next";

const SITE_URL = "https://kyma.synthetic.com.ar";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  ): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("/", 1, "weekly"),
    page("/studio", 0.9, "weekly"),
    page("/docs", 0.7, "monthly"),
    page("/docs/quickstart", 0.6, "monthly"),
    page("/docs/autenticacion", 0.6, "monthly"),
    page("/docs/generate", 0.6, "monthly"),
    page("/docs/errores", 0.5, "monthly"),
    page("/docs/api", 0.6, "monthly"),
    page("/terminos", 0.3, "yearly"),
    page("/privacidad", 0.3, "yearly"),
  ];
}
