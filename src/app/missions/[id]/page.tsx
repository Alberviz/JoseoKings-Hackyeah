import { MissionRunScreen } from "@/components/features/missions";

type MissionRunPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MissionRunPage({ params }: MissionRunPageProps) {
  const { id } = await params;
  return <MissionRunScreen missionId={id} />;
}
