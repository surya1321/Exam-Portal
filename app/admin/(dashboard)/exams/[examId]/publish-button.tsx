"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { togglePublishExam } from "../actions";

interface PublishButtonProps {
    examId: string;
    isPublished: boolean;
}

export function PublishButton({ examId, isPublished }: PublishButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleToggle() {
        startTransition(async () => {
            const result = await togglePublishExam(examId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isPublished ? "Exam unpublished" : "Exam published");
                router.refresh();
            }
        });
    }

    return (
        <Button
            variant={isPublished ? "outline" : "default"}
            size="sm"
            onClick={handleToggle}
            disabled={isPending}
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPublished ? (
                <EyeOff className="h-4 w-4" />
            ) : (
                <Eye className="h-4 w-4" />
            )}
            {isPending
                ? isPublished
                    ? "Unpublishing..."
                    : "Publishing..."
                : isPublished
                    ? "Unpublish"
                    : "Publish"}
        </Button>
    );
}
