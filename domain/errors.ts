export type AppErrorKind =
  | "validation"
  | "not-found"
  | "conflict"
  | "constraint"
  | "persistence"
  | "unsupported-media"
  | "share-link";

export interface AppErrorDetails {
  readonly cause?: unknown;
  readonly field?: string;
  readonly entity?: string;
  readonly constraint?: string;
}

export abstract class AppError extends Error {
  abstract readonly kind: AppErrorKind;
  readonly details?: AppErrorDetails;

  protected constructor(message: string, details?: AppErrorDetails) {
    super(message);
    this.name = new.target.name;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  readonly kind = "validation";

  constructor(message: string, details?: AppErrorDetails) {
    super(message, details);
  }
}

export class NotFoundError extends AppError {
  readonly kind = "not-found";

  constructor(message: string, details?: AppErrorDetails) {
    super(message, details);
  }
}

export class ConflictError extends AppError {
  readonly kind = "conflict";

  constructor(message: string, details?: AppErrorDetails) {
    super(message, details);
  }
}

export class ConstraintError extends AppError {
  readonly kind = "constraint";

  constructor(message: string, details?: AppErrorDetails) {
    super(message, details);
  }
}

export class PersistenceError extends AppError {
  readonly kind = "persistence";

  constructor(message: string, details?: AppErrorDetails) {
    super(message, details);
  }
}

export class UnsupportedMediaError extends AppError {
  readonly kind = "unsupported-media";

  constructor(message: string, details?: AppErrorDetails) {
    super(message, details);
  }
}

export class ShareLinkError extends AppError {
  readonly kind = "share-link";

  constructor(message: string, details?: AppErrorDetails) {
    super(message, details);
  }
}

export const toUserFacingErrorMessage = (error: AppError): string => {
  switch (error.kind) {
    case "validation":
      return "Check the highlighted fields and try again.";
    case "not-found":
      return "That item could not be found. Refresh the workspace and try again.";
    case "conflict":
      return "This change conflicts with an existing item.";
    case "constraint":
      return error.message;
    case "persistence":
      return "The local demo data could not be saved. Try resetting the demo data.";
    case "unsupported-media":
      return "Vibra only supports audio and haptic assets in this prototype.";
    case "share-link":
      return "The share link could not be created or opened.";
  }
};
