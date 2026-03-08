import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ExamInfoPage({
  params,
}: {
  params: Promise<{ accessLink: string }>;
}) {
  const { accessLink } = await params;

  // TODO: Fetch exam by accessLink from Prisma in Phase 3

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Online Examination</CardTitle>
          <CardDescription>Access Code: {accessLink}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Please login with your credentials to start the exam.
          </p>
          <Link href={`/exam/${accessLink}/login`}>
            <Button className="w-full">Login to Start Exam</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
