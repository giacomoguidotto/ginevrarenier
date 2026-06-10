const CONVEX_REQUEST_ID_RE = /\[Request ID: ([^\]]+)\]/;

export const adminFailureKinds = [
  "expected_auth_denial",
  "expected_validation",
  "unexpected_admin_failure",
  "data_integrity_risk",
] as const;

export type AdminFailureKind = (typeof adminFailureKinds)[number];

type AdminFailureSeverity = "critical" | "error" | "local";

interface AdminFailurePolicy {
  reportToSentry: boolean;
  severity: AdminFailureSeverity;
}

export const adminFailurePolicies = {
  data_integrity_risk: {
    reportToSentry: true,
    severity: "critical",
  },
  expected_auth_denial: {
    reportToSentry: false,
    severity: "local",
  },
  expected_validation: {
    reportToSentry: false,
    severity: "local",
  },
  unexpected_admin_failure: {
    reportToSentry: true,
    severity: "error",
  },
} as const satisfies Record<AdminFailureKind, AdminFailurePolicy>;

type AdminFailureReason =
  | "auth_expired"
  | "auth_reconnecting"
  | "operation_threw";

export interface AdminFailureClassification {
  kind: AdminFailureKind;
  message: string;
  reason: AdminFailureReason;
  requestId?: string;
}

export function errorText(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function extractConvexRequestId(error: unknown) {
  return errorText(error).match(CONVEX_REQUEST_ID_RE)?.[1];
}

export function classifyExpectedAuthDenial(
  reason: Extract<AdminFailureReason, "auth_expired" | "auth_reconnecting">
): AdminFailureClassification {
  return {
    kind: "expected_auth_denial",
    message:
      reason === "auth_reconnecting"
        ? "Convex auth is reconnecting"
        : "Convex auth is not authenticated",
    reason,
  };
}

export function classifyUnexpectedAdminFailure(
  error: unknown
): AdminFailureClassification {
  return {
    kind: "unexpected_admin_failure",
    message: errorText(error),
    reason: "operation_threw",
    requestId: extractConvexRequestId(error),
  };
}

export function shouldReportAdminFailure(
  classification: AdminFailureClassification
) {
  return adminFailurePolicies[classification.kind].reportToSentry;
}

export function adminFailureContext(
  classification: AdminFailureClassification
) {
  const policy = adminFailurePolicies[classification.kind];
  return {
    kind: classification.kind,
    message: classification.message,
    reason: classification.reason,
    reportToSentry: policy.reportToSentry,
    requestId: classification.requestId,
    severity: policy.severity,
  };
}
