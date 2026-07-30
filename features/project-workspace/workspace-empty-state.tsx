import { Plus } from "lucide-react";
import { Button } from "@/components/primitives";

export function EmptyProjectWorkspace({ onAddDevice }: { onAddDevice: () => void }) {
  return (
    <div className="grid min-h-[min(680px,calc(100vh-220px))] grid-rows-[auto_1fr]">
      <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-3">
        <h2 className="truncate text-md font-semibold text-gray-700">Untitled</h2>
        <Button disabled leftIcon={<Plus className="size-4" />}>
          Add event
        </Button>
      </div>

      <div className="relative mt-9 border-t border-gray-200">
        <div
          aria-hidden="true"
          className="grid h-10 grid-cols-[minmax(180px,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] items-center border-b border-gray-200 px-3 text-xs font-medium text-gray-400"
        >
          <span>Name</span>
          <span>Event</span>
          <span>Sound</span>
          <span>Haptic</span>
        </div>

        <div className="flex min-h-[420px] items-center justify-center px-4 py-14 text-center">
          <div className="grid max-w-sm gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Select a system to begin</p>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Select the type of operating system that your sound and haptic events will play on.
              </p>
            </div>
            <div className="flex justify-center">
              <Button leftIcon={<Plus className="size-4" />} onClick={onAddDevice}>
                Add system
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

