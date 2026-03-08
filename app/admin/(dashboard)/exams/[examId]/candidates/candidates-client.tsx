"use client";

import { useState, useTransition } from "react";
import { Copy, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteCandidate } from "./actions";
import { AddCandidateDialog } from "./add-candidate-dialog";

export type CandidateItem = {
  id: string;
  fullName: string;
  username: string;
  email: string | null;
  isUsed: boolean;
  createdAt: string;
  attempts: { status: string; totalScore: number }[];
};

interface CandidatesClientProps {
  examId: string;
  examTitle: string;
  accessLink: string;
  candidates: CandidateItem[];
}

function getAttemptBadge(attempts: CandidateItem["attempts"]) {
  if (attempts.length === 0) {
    return <Badge variant="secondary">No attempt</Badge>;
  }
  const attempt = attempts[0];
  switch (attempt.status) {
    case "completed":
      return (
        <Badge className="bg-green-600 text-white hover:bg-green-600/90">
          Completed ({attempt.totalScore})
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-blue-600 text-white hover:bg-blue-600/90">
          In Progress
        </Badge>
      );
    case "timed_out":
      return (
        <Badge className="bg-orange-600 text-white hover:bg-orange-600/90">
          Timed Out ({attempt.totalScore})
        </Badge>
      );
    case "abandoned":
      return <Badge variant="destructive">Abandoned</Badge>;
    default:
      return <Badge variant="secondary">{attempt.status}</Badge>;
  }
}

export function CandidatesClient({
  examId,
  examTitle,
  accessLink,
  candidates,
}: CandidatesClientProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  function handleCopyLink() {
    const fullUrl = `${window.location.origin}/exam/${accessLink}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      toast.success("Access link copied to clipboard");
    });
  }

  function handleDeleteConfirm() {
    if (!candidateToDelete) return;
    startTransition(async () => {
      const result = await deleteCandidate(examId, candidateToDelete);
      if ("success" in result) {
        toast.success("Candidate deleted");
      } else {
        toast.error("Failed to delete candidate");
      }
      setCandidateToDelete(null);
      setDeleteDialogOpen(false);
    });
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground text-sm">{examTitle}</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Candidate
        </Button>
      </div>

      {/* Access link card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Exam Access Link</CardTitle>
          <CardDescription>
            Share this link with candidates so they can access the exam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="bg-muted flex-1 truncate rounded-md px-3 py-2 text-sm font-mono">
              {typeof window !== "undefined"
                ? `${window.location.origin}/exam/${accessLink}`
                : `/exam/${accessLink}`}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidates table */}
      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Users className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-1 text-lg font-semibold">No candidates yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Add candidates to allow them to take this exam.
          </p>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Candidate
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              All Candidates ({candidates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">
                      {candidate.fullName}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{candidate.username}</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {candidate.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={candidate.isUsed ? "default" : "outline"}
                      >
                        {candidate.isUsed ? "Used" : "Unused"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getAttemptBadge(candidate.attempts)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setCandidateToDelete(candidate.id);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={isPending}
                        title="Delete candidate"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add candidate dialog */}
      <AddCandidateDialog
        examId={examId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this candidate? This will
              permanently remove their credentials and any associated attempt
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCandidateToDelete(null);
                setDeleteDialogOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
