import { describe, expect, it } from "vitest";
import {
  adminFailureContext,
  adminFailureKinds,
  adminFailurePolicies,
  classifyExpectedAuthDenial,
  classifyUnexpectedAdminFailure,
  shouldReportAdminFailure,
} from "./admin-failures";

describe("admin failure classification", () => {
  it("models the admin failure kinds and their Sentry reporting policy", () => {
    expect(adminFailureKinds).toEqual([
      "expected_auth_denial",
      "expected_validation",
      "unexpected_admin_failure",
      "data_integrity_risk",
    ]);
    expect(adminFailurePolicies.expected_auth_denial.reportToSentry).toBe(
      false
    );
    expect(adminFailurePolicies.expected_validation.reportToSentry).toBe(false);
    expect(adminFailurePolicies.unexpected_admin_failure.reportToSentry).toBe(
      true
    );
    expect(adminFailurePolicies.data_integrity_risk.reportToSentry).toBe(true);
  });

  it("classifies auth denial as expected and local", () => {
    const classification = classifyExpectedAuthDenial("auth_expired");

    expect(classification.kind).toBe("expected_auth_denial");
    expect(shouldReportAdminFailure(classification)).toBe(false);
    expect(adminFailureContext(classification)).toMatchObject({
      kind: "expected_auth_denial",
      reason: "auth_expired",
      reportToSentry: false,
      severity: "local",
    });
  });

  it("classifies thrown admin failures as unexpected with Convex correlation", () => {
    const classification = classifyUnexpectedAdminFailure(
      new Error(
        "[CONVEX M(siteContent:upsert)] [Request ID: abc123] Server Error"
      )
    );

    expect(classification.kind).toBe("unexpected_admin_failure");
    expect(classification.requestId).toBe("abc123");
    expect(shouldReportAdminFailure(classification)).toBe(true);
    expect(adminFailureContext(classification)).toMatchObject({
      kind: "unexpected_admin_failure",
      reason: "operation_threw",
      reportToSentry: true,
      severity: "error",
    });
  });
});
