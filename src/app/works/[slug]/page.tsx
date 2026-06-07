import { notFound } from "next/navigation";
import { getAllSlugs, getWorkBySlug } from "@/lib/works";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = getWorkBySlug(slug);

  if (!work) {
    notFound();
  }

  return <h1>{work.title}</h1>;
}
