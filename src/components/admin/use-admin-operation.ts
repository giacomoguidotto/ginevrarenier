"use client";

import { useConvexAuth } from "convex/react";
import { Effect } from "effect";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";
import { classifyExpectedAuthDenial } from "./admin-failures";
import { useAdminNotifications } from "./admin-notifications";
import {
  type AdminOperationResult,
  type ConvexAuthSnapshot,
  runAdminOperationResultEffect,
  type SpanAttribute,
} from "./admin-operation-runtime";

interface AdminOperationOptions {
  attributes?: Record<string, SpanAttribute | undefined>;
  errorMessage?: string;
  errorTitle?: string;
  name: string;
  op?: string;
}

type NotifyAdmin = ReturnType<typeof useAdminNotifications>["notify"];

const AUTH_READY_WAIT_MS = 5000;
const AUTH_READY_POLL_MS = 100;

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
        const classification = classifyExpectedAuthDenial(
          wasResolving ? "auth_reconnecting" : "auth_expired"
        );
        const error = new Error(classification.message);
        notify({
          message: wasResolving
            ? "Your admin session is reconnecting. Try again in a moment."
            : "Your admin session expired. Sign in again, then retry this action.",
          title: wasResolving ? "Session reconnecting" : "Session expired",
          tone: "error",
        });
        return { error, failureKind: classification.kind, ok: false };
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
  return await Effect.runPromise(
    runAdminOperationResultEffect<T>({
      auth: authRef.current,
      notify,
      operation,
      options: {
        attributes,
        errorMessage: options.errorMessage,
        errorTitle: options.errorTitle,
        name: options.name,
        op,
      },
    })
  );
}
