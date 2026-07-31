import { describe, expect, it } from "vitest";
import * as v from "valibot";

import {
  ConflictError,
  ConstraintError,
  createEventCommandSchema,
  createProjectCommandSchema,
  createTriggerPlaybackCommandSchema,
  errApp,
  eventSchema,
  generateSharingLinkCommandSchema,
  NotFoundError,
  PersistenceError,
  shareRouteParamsSchema,
  toUserFacingErrorMessage,
  unwrapQueryResult,
  UnsupportedMediaError,
  ValidationError
} from "../domain";

describe("domain command validation", () => {
  it("accepts command inputs used by create flows", () => {
    expect(
      v.parse(createProjectCommandSchema, {
        folderId: null,
        name: "Launch Experience"
      })
    ).toEqual({
      folderId: null,
      name: "Launch Experience",
      devices: [],
      starterEventTypes: []
    });

    expect(
      v.parse(createEventCommandSchema, {
        collectionId: "collection_1",
        name: "Primary CTA",
        eventType: "Button"
      })
    ).toMatchObject({ eventType: "Button" });

    expect(
      v.parse(generateSharingLinkCommandSchema, {
        target: { kind: "event", eventId: "event_1" },
        createdByUserId: "user_1"
      })
    ).toMatchObject({ target: { kind: "event" } });
  });

  it("rejects malformed command inputs before service logic runs", () => {
    expect(v.safeParse(createProjectCommandSchema, { folderId: "folder_1", name: "" }).success).toBe(
      false
    );

    expect(
      v.safeParse(createEventCommandSchema, {
        collectionId: "collection_1",
        name: "Primary CTA",
        eventType: "Slider"
      }).success
    ).toBe(false);

    expect(
      v.safeParse(createTriggerPlaybackCommandSchema, {
        eventTriggerId: "event_trigger_1",
        assetId: "asset_1",
        startOffset: -0.1
      }).success
    ).toBe(false);

    expect(
      v.safeParse(eventSchema, {
        id: "event_1",
        collectionId: "collection_1",
        name: "Primary CTA",
        eventType: "Button",
        sortOrder: -1
      }).success
    ).toBe(false);

    expect(
      v.safeParse(eventSchema, {
        id: "event_1",
        collectionId: "collection_1",
        name: "Primary CTA",
        eventType: "Button",
        sortOrder: 0.5
      }).success
    ).toBe(false);
  });

  it("validates share route params", () => {
    expect(v.safeParse(shareRouteParamsSchema, { shareToken: "share_1" }).success).toBe(true);
    expect(v.safeParse(shareRouteParamsSchema, { shareToken: "" }).success).toBe(false);
    expect(v.safeParse(shareRouteParamsSchema, { shareToken: "share_1", extra: true }).success).toBe(
      false
    );
  });
});

describe("domain errors", () => {
  it("provides typed error classes for app boundaries", () => {
    expect(new ValidationError("Invalid input").kind).toBe("validation");
    expect(new NotFoundError("Missing event").kind).toBe("not-found");
    expect(new ConflictError("Duplicate device").kind).toBe("conflict");
    expect(new ConstraintError("Suppress requires a target.").kind).toBe("constraint");
    expect(new PersistenceError("IndexedDB failed").kind).toBe("persistence");
    expect(new UnsupportedMediaError("Unsupported file").kind).toBe("unsupported-media");
  });

  it("maps domain errors to user-facing copy", () => {
    expect(toUserFacingErrorMessage(new ValidationError("Raw parser detail"))).toBe(
      "Check the highlighted fields and try again."
    );
    expect(toUserFacingErrorMessage(new ConstraintError("Suppress requires a target."))).toBe(
      "Suppress requires a target."
    );
  });

  it("unwraps failed query results by throwing the typed app error", () => {
    const error = new PersistenceError("IndexedDB failed");

    expect(() => unwrapQueryResult(errApp(error))).toThrow(error);
  });
});
