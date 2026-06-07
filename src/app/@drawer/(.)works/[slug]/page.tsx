import { notFound } from "next/navigation";
import WorksDrawer from "@/components/WorksDrawer";
import { getWorkBySlug } from "@/lib/works";

export default async function DrawerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = getWorkBySlug(slug);

  if (!work) {
    notFound();
  }

  return (
    <WorksDrawer>
      <h1>{work.title}</h1>
    </WorksDrawer>
  );
}
