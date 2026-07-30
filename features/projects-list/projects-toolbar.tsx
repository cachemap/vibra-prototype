import { TextInput } from "@/components/primitives";

type ProjectsToolbarProps = {
  onSearchTermChange: (term: string) => void;
  searchTerm: string;
};

export function ProjectsToolbar({ onSearchTermChange, searchTerm }: ProjectsToolbarProps) {
  return (
    <div className="flex flex-wrap items-end justify-end gap-3 border-b border-gray-300 pb-3">
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
        <TextInput
          className="w-full sm:w-[220px]"
          id="project-search"
          label="Search"
          onChange={(event) => onSearchTermChange(event.currentTarget.value)}
          placeholder="Search projects"
          type="search"
          value={searchTerm}
        />
      </div>
    </div>
  );
}
