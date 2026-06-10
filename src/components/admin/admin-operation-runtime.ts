import { captureException, startSpan, withScope } from "@sentry/nextjs";
import { Data, Effect } from "effect";
import {
  type AdminFailureClassification,
  type AdminFailureKind,
  adminFailureContext,
  classifyUnexpectedAdminFailure,
  shouldReportAdminFailure,
} from "./admin-failures";

export type SpanAttribute = boolean | number | string;

export interface ConvexAuthSnapshot {
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
}

export interface AdminOperationRuntimeOptions {
  attributes?: Record<string, SpanAttribute>;
  errorMessage?: string;
  errorTitle?: string;
  name: string;
  op: string;
}

export type AdminOperationResult<T> =
  | { ok: true; value: T }
  | {
      error: unknown;
      failureKind: AdminFailureKind;
      ok: false;
      requestId?: string;
      sentryEventId?: string;
    };

interface AdminRuntimeNotification {
  message: string;
  requestId?: string;
  sentryEventId?: string;
  title: string;
  tone: "error";
}

export type NotifyAdmin = (notification: AdminRuntimeNotification) => string;

class UnexpectedAdminFailure extends Data.TaggedError(
  "UnexpectedAdminFailure"
)<{
  classification: AdminFailureClassification;
  error: unknown;
}> {}

interface RunAdminOperationEffectOptions<T> {
  attributes?: Record<string, SpanAttribute>;
  name: string;
  op: string;
  operation: () => Promise<T> | T;
}

export function runAdminOperationEffect<T>({
  attributes,
  name,
  op,
  operation,
}: RunAdminOperationEffectOptions<T>): Effect.Effect<
  T,
  UnexpectedAdminFailure
> {
  return Effect.tryPromise({
    catch: (error) =>
      new UnexpectedAdminFailure({
        classification: classifyUnexpectedAdminFailure(error),
        error,
      }),
    try: async (): Promise<T> => {
      const value = await startSpan(
        {
          attributes,
          name,
          op,
        },
        operation
      );
      return value as T;
    },
  });
}

export function runAdminOperationResultEffect<T>({
  auth,
  notify,
  operation,
  options,
}: {
  auth: ConvexAuthSnapshot;
  notify: NotifyAdmin;
  operation: () => Promise<T> | T;
  options: AdminOperationRuntimeOptions;
}): Effect.Effect<AdminOperationResult<T>> {
  const operationEffect = runAdminOperationEffect<T>({
    attributes: options.attributes,
    name: options.name,
    op: options.op,
    operation,
  });
  const successEffect = Effect.map(
    operationEffect,
    (value): AdminOperationResult<T> => ({ ok: true, value })
  );
  return Effect.catchTag(successEffect, "UnexpectedAdminFailure", (failure) =>
    Effect.sync(() =>
      reportUnexpectedAdminFailure<T>({
        auth,
        failure,
        notify,
        options,
      })
    )
  );
}

function reportUnexpectedAdminFailure<T>({
  auth,
  failure,
  notify,
  options,
}: {
  auth: ConvexAuthSnapshot;
  failure: UnexpectedAdminFailure;
  notify: NotifyAdmin;
  options: AdminOperationRuntimeOptions;
}): AdminOperationResult<T> {
  const { classification, error } = failure;
  const requestId = classification.requestId;
  const sentryEventId = shouldReportAdminFailure(classification)
    ? withScope((scope) => {
        scope.setTag("area", "admin");
        scope.setTag("admin.failure_kind", classification.kind);
        scope.setTag("admin.operation", options.name);
        scope.setTag("admin.operation.op", options.op);
        if (requestId) {
          scope.setTag("convex.request_id", requestId);
        }
        scope.setContext("admin_failure", adminFailureContext(classification));
        scope.setContext("admin_operation", {
          attributes: options.attributes,
          message: classification.message,
          name: options.name,
          op: options.op,
          requestId,
        });
        scope.setContext("convex_auth", {
          isAuthenticated: auth.isAuthenticated,
          isLoading: auth.isLoading,
          isRefreshing: auth.isRefreshing,
        });
        return captureException(error);
      })
    : undefined;

  notify({
    message: options.errorMessage ?? "The support team has been notified.",
    requestId,
    sentryEventId,
    title: options.errorTitle ?? "Something went wrong",
    tone: "error",
  });

  return {
    error,
    failureKind: classification.kind,
    ok: false,
    requestId,
    sentryEventId,
  };
}
