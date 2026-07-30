const memberInitials = ["D", "P", "A"];

export function MemberStack() {
  return (
    <span className="inline-flex max-w-full items-center">
      <span className="flex shrink-0 items-center">
        {memberInitials.map((initial, index) => (
          <span
            className="-ml-1 flex size-5 items-center justify-center rounded-full border border-gray-25 bg-gray-200 text-[10px] font-semibold text-gray-700 first:ml-0"
            key={initial}
            style={{ zIndex: memberInitials.length - index }}
          >
            {initial}
          </span>
        ))}
      </span>
      <span className="ml-2 whitespace-nowrap text-xs text-gray-500">+2</span>
    </span>
  );
}
