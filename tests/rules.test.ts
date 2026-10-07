import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { canMove, genderOk, verifySig } from "../lib/rules";
describe("complaint workflow", () => {
  it("allows the legal path", () => { expect(canMove("NEW", "ASSIGNED")).toBe(true); expect(canMove("IN_PROGRESS", "RESOLVED")).toBe(true); });
  it("blocks skipping steps", () => { expect(canMove("NEW", "RESOLVED")).toBe(false); expect(canMove("CLOSED", "NEW")).toBe(false); });
});
describe("allocation rules", () => {
  it("matches gender to hostel type", () => { expect(genderOk("F", "Boys")).toBe(false); expect(genderOk("M", "Boys")).toBe(true); expect(genderOk("F", "Co-ed")).toBe(true); });
});
describe("webhook signature", () => {
  const body = '{"a":1}', sec = "s3cret", good = createHmac("sha256", sec).update(body).digest("hex");
  it("accepts a valid signature", () => expect(verifySig(body, good, sec)).toBe(true));
  it("rejects tampered body or bad signature", () => { expect(verifySig('{"a":2}', good, sec)).toBe(false); expect(verifySig(body, "x", sec)).toBe(false); });
});
