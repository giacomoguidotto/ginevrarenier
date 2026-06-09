"use client";

import { captureException, startSpan, withScope } from "@sentry/nextjs";
import { useConvexAuth } from "convex/react";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";
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
  | { error: unknown; ok: false; requestId?: string; sentryEventId?: string };
type NotifyAdmin = ReturnType<typeof useAdminNotifications>["notify"];

const CONVEX_REQUEST_ID_RE = /\[Request ID: ([^\]]+)\]/;
const AUTH_READY_WAIT_MS = 5000;
const AUTH_READY_POLL_MS = 100;

interface ConvexAuthSnapshot {
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAuthReady(auth: ConvexAuthSnapshot) {
  return auth.isAuthenticated && !(auth.isLoading || auth.isRefreshing);
}

function isAuthResolving(auth: ConvexAuthSnapshot) {
  return auth.isLoading || auth.isRefreshing;
}

async function waitForAuthReady(authRef: RefObject<ConvexAuthSnapshot>) {
  const deadline = Date.now() + AUTH_READY_WAIT_MS;
  while (Date.now() < deadline) {
    if (isAuthReady(authRef.current)) {
      return true;
    }
    if (!isAuthResolving(authRef.current)) {
      return false;
    }
    await delay(AUTH_READY_POLL_MS);
  }
  return isAuthReady(authRef.current);
}

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
  const { isAuthenticated, isLoading, isRefreshing } = useConvexAuth();
  const authRef = useRef<ConvexAuthSnapshot>({
    isAuthenticated,
    isLoading,
    isRefreshing,
  });

  useEffect(() => {
    authRef.current = { isAuthenticated, isLoading, isRefreshing };
  }, [isAuthenticated, isLoading, isRefreshing]);

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

      if (!isAuthReady(authRef.current)) {
        const wasResolving = isAuthResolving(authRef.current);
        const ready = wasResolving ? await waitForAuthReady(authRef) : false;
        if (ready) {
          return await runAdminOperationAfterAuth(
            options,
            operation,
            op,
            attributes,
            authRef,
            notify
          );
        }
        const error = new Error(
          wasResolving
            ? "Convex auth is reconnecting"
            : "Convex auth is not authenticated"
        );
        notify({
          message: wasResolving
            ? "Your admin session is reconnecting. Try again in a moment."
            : "Your admin session expired. Sign in again, then retry this action.",
          title: wasResolving ? "Session reconnecting" : "Session expired",
          tone: "error",
        });
        return { error, ok: false };
      }

      return await runAdminOperationAfterAuth(
        options,
        operation,
        op,
        attributes,
        authRef,
        notify
      );
    },
    [notify]
  );
}

async function runAdminOperationAfterAuth<T>(
  options: AdminOperationOptions,
  operation: () => Promise<T> | T,
  op: string,
  attributes: Record<string, SpanAttribute> | undefined,
  authRef: RefObject<ConvexAuthSnapshot>,
  notify: NotifyAdmin
): Promise<AdminOperationResult<T>> {
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
    const auth = authRef.current;
    const sentryEventId = withScope((scope) => {
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
      scope.setContext("convex_auth", {
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        isRefreshing: auth.isRefreshing,
      });
      return captureException(error);
    });

    notify({
      message: options.errorMessage ?? "The support team has been notified.",
      requestId,
      sentryEventId,
      title: options.errorTitle ?? "Something went wrong",
      tone: "error",
    });

    return { error, ok: false, requestId, sentryEventId };
  }
}
