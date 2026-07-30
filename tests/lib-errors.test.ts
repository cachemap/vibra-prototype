import { describe, expect, it } from "vitest";

import { ConstraintError } from "../domain";
import {
  eventWorkspaceErrorFallback,
  libraryErrorFallback,
  messageForError,
  projectsErrorFallback,
  shareErrorFallback,
  workspaceErrorFallback
} from "../lib/errors";

describe("lib errors", () => {
  it("returns the domain user-facing message plus the concrete error detail", () => {
    expect(messageForError(new ConstraintError("Suppress requires a target."), "Fallback")).toBe(
      "Suppress requires a target. Suppress requires a target."
    );
  });

  it("returns the required fallback for non-domain errors", () => {
    expect(messageForError(new Error("Nope"), libraryErrorFallback)).toBe(
      "The local asset library could not be updated."
    );
  });

  it("keeps every current page fallback transcribed exactly", () => {
    expect(workspaceErrorFallback).toBe("The local demo workspace could not be updated.");
    expect(eventWorkspaceErrorFallback).toBe("The local demo workspace could not be updated.");
    expect(libraryErrorFallback).toBe("The local asset library could not be updated.");
    expect(projectsErrorFallback).toBe("The local demo data could not be updated.");
    expect(shareErrorFallback).toBe("The local share preview could not be opened.");
  });
});
