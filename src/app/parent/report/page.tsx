import type { Metadata } from "next";
import { ReportScreen } from "@/components/features/doctor-report/ReportScreen/ReportScreen";

export const metadata: Metadata = {
  title: "Doctor report",
};

export default function DoctorReportPage() {
  return <ReportScreen />;
}
