import { TextInput } from "@/components/primitives";

export function ProjectsToolbar() {
  return (
    <div className="flex flex-wrap items-end justify-end gap-3 border-b border-gray-300 pb-3">
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
        <TextInput
          className="w-full sm:w-[220px]"
          disabled
          id="project-search"
          label="Search"
          placeholder="Search arrives in a later slice"
        />
      </div>
    </div>
  );
}
