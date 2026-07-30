"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";

import { messageForError } from "@/lib/errors";

type FeedbackActions = {
  clearFeedback: () => void;
  reportError: (error: unknown) => void;
  runWithFeedback: <T>(options: {
    onSuccess?: (value: T) => string | null;
    work: () => Promise<T>;
  }) => Promise<T | undefined>;
  setFeedback: (message: string | null) => void;
};

const FeedbackMessageContext = createContext<string | null | undefined>(undefined);
const FeedbackActionsContext = createContext<FeedbackActions | null>(null);

type FeedbackProviderProps = {
  children: ReactNode;
  errorFallback: string;
  initialMessage?: string | null;
};

export function FeedbackProvider({
  children,
  errorFallback,
  initialMessage = null
}: FeedbackProviderProps) {
  const [message, setMessage] = useState<string | null>(initialMessage);

  const clearFeedback = useCallback(() => setMessage(null), []);

  const reportError = useCallback(
    (error: unknown) => {
      setMessage(messageForError(error, errorFallback));
    },
    [errorFallback]
  );

  const runWithFeedback = useCallback(
    async <T,>({
      onSuccess,
      work
    }: {
      onSuccess?: (value: T) => string | null;
      work: () => Promise<T>;
    }): Promise<T | undefined> => {
      setMessage(null);

      try {
        const value = await work();
        const successMessage = onSuccess?.(value);

        if (successMessage !== undefined) {
          setMessage(successMessage);
        }

        return value;
      } catch (error) {
        setMessage(messageForError(error, errorFallback));
        return undefined;
      }
    },
    [errorFallback]
  );

  const actions = useMemo<FeedbackActions>(
    () => ({
      clearFeedback,
      reportError,
      runWithFeedback,
      setFeedback: setMessage
    }),
    [clearFeedback, reportError, runWithFeedback]
  );

  // Providers receive children as an opaque subtree so provider state changes only re-render context consumers.
  return (
    <FeedbackActionsContext.Provider value={actions}>
      <FeedbackMessageContext.Provider value={message}>{children}</FeedbackMessageContext.Provider>
    </FeedbackActionsContext.Provider>
  );
}

export function useFeedbackMessage(): string | null {
  const message = useContext(FeedbackMessageContext);

  if (message === undefined) {
    throw new Error("useFeedbackMessage must be used within FeedbackProvider.");
  }

  return message;
}

export function useFeedbackActions(): FeedbackActions {
  const actions = useContext(FeedbackActionsContext);

  if (!actions) {
    throw new Error("useFeedbackActions must be used within FeedbackProvider.");
  }

  return actions;
}

export function FeedbackText({ className }: { className?: string }) {
  const message = useFeedbackMessage();

  return message ? <p className={className ?? "text-sm text-gray-600"}>{message}</p> : null;
}

export function FeedbackBanner() {
  const message = useFeedbackMessage();

  return message ? (
    <p className="min-h-10 border-y border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700" role="status">
      {message}
    </p>
  ) : null;
}
