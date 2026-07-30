import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DialogOverlay, FormDialog, TextInput } from "@/components/primitives";
import type { ProjectFolderNode } from "@/data/repositories/project-repository";
import { DEMO_USER_ID } from "@/data/seed";
import { useFeedbackActions } from "@/features/feedback/feedback-context";
import { useCreateProjectFolderMutation } from "@/features/projects/queries";

type CreateFolderDialogProps = {
  currentFolder: ProjectFolderNode | null;
  onClose: () => void;
};

export function CreateFolderDialog({
  currentFolder,
  onClose
}: CreateFolderDialogProps) {
  const router = useRouter();
  const createFolder = useCreateProjectFolderMutation();
  const { runWithFeedback } = useFeedbackActions();
  const [folderName, setFolderName] = useState("");

  const handleCreateFolder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runWithFeedback({
      work: async () => {
        const folder = await createFolder.mutateAsync({
          parentFolderId: currentFolder?.folder.id ?? null,
          createdByUserId: currentFolder ? undefined : DEMO_USER_ID,
          name: folderName
        });

        setFolderName("");
        onClose();
        router.push(`/projects?folder=${folder.id}`);
        return folder;
      },
      onSuccess: (folder) => `Created folder ${folder.name}.`
    });
  };

  return (
    <DialogOverlay>
      <FormDialog
        className="max-w-md"
        formId="create-folder-form"
        onCancel={onClose}
        onSubmit={handleCreateFolder}
        submitLabel="Create folder"
        title="Create folder"
      >
        <TextInput
          autoFocus
          id="folder-name"
          label="Folder name"
          onChange={(event) => setFolderName(event.target.value)}
          placeholder="Empty Explorations"
          value={folderName}
        />
      </FormDialog>
    </DialogOverlay>
  );
}
