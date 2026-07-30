"use client";

import { Suspense, useState } from "react";
import { LoadingState } from "@/components/primitives";
import { FeedbackProvider } from "@/features/feedback/feedback-context";
import { ProjectsContent } from "@/features/projects-list/projects-content";
import { projectsErrorFallback } from "@/lib/errors";
import { readAndClearFlashMessage } from "@/lib/flash-message";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading projects" />}>
      <ProjectsFeedbackScope />
    </Suspense>
  );
}

function ProjectsFeedbackScope() {
  const [initialMessage] = useState(() => readAndClearFlashMessage());

  return (
    <FeedbackProvider errorFallback={projectsErrorFallback} initialMessage={initialMessage}>
      <ProjectsContent />
    </FeedbackProvider>
  );
}
