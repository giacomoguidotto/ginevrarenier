"use client";

import { captureException, startSpan, withScope } from "@sentry/nextjs";
import { useCallback } from "react";
import { useAdminNotifications } from "./admin-notifications";

type SpanAttribute = boolean | number | string;

interface AdminOperationOptions {
  attributes?: Record<string, SpanAttribute | undefined>;
  errorMessage?: string;
  errorTitle?: string;
  name: string;
  op?: string;
}

type AdminOperationResult<T> =
  | { ok: true; value: T }
  | { error: unknown; ok: false; requestId?: string };

const CONVEX_REQUEST_ID_RE = /\[Request ID: ([^\]]+)\]/;

function compactAttributes(attributes: AdminOperationOptions["attributes"]) {
  if (!attributes) {
    return;
  }
  return Object.fromEntries(
    Object.entries(attributes).filter(
      (entry): entry is [string, SpanAttribute] => entry[1] !== undefined
    )
  );
}

function errorText(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function extractConvexRequestId(error: unknown) {
  return errorText(error).match(CONVEX_REQUEST_ID_RE)?.[1];
}

export function useAdminOperation() {
  const { notify } = useAdminNotifications();

  return useCallback(
    async <T>(
      options: AdminOperationOptions,
      operation: () => Promise<T> | T
    ): Promise<AdminOperationResult<T>> => {
      const op = options.op ?? "admin.operation";
      const attributes = compactAttributes({
        "admin.operation": options.name,
        ...options.attributes,
      });

      try {
        const value = await startSpan(
          {
            attributes,
            name: options.name,
            op,
          },
          operation
        );
        return { ok: true, value };
      } catch (error) {
        const requestId = extractConvexRequestId(error);
        withScope((scope) => {
          scope.setTag("area", "admin");
          scope.setTag("admin.operation", options.name);
          scope.setTag("admin.operation.op", op);
          if (requestId) {
            scope.setTag("convex.request_id", requestId);
          }
          scope.setContext("admin_operation", {
            attributes,
            message: errorText(error),
            name: options.name,
            op,
            requestId,
          });
          captureException(error);
        });

        notify({
          message:
            options.errorMessage ?? "The support team has been notified.",
          requestId,
          title: options.errorTitle ?? "Something went wrong",
          tone: "error",
        });

        return { error, ok: false, requestId };
      }
    },
    [notify]
  );
}
