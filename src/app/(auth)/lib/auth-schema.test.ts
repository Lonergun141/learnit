import { describe, expect, it } from "vitest";

import { loginSchema, retainedAuthValues, signupSchema } from "./auth-schema";

describe("authentication form contracts", () => {
  it("normalizes a valid email login", () => {
    expect(
      loginSchema.parse({
        email: "  Learner@Example.com ",
        password: "correct horse battery staple",
      }),
    ).toEqual({
      email: "learner@example.com",
      password: "correct horse battery staple",
    });
  });

  it("rejects malformed login credentials", () => {
    expect(
      loginSchema.safeParse({ email: "not-an-email", password: "short" }).success,
    ).toBe(false);
  });

  it("requires a useful display name and strong signup password", () => {
    expect(
      signupSchema.safeParse({
        displayName: "A",
        email: "learner@example.com",
        password: "password",
      }).success,
    ).toBe(false);
  });

  it("accepts a complete signup", () => {
    expect(
      signupSchema.parse({
        displayName: "  Ada Learner  ",
        email: "ADA@EXAMPLE.COM",
        password: "Study!With7Signals",
      }),
    ).toEqual({
      displayName: "Ada Learner",
      email: "ada@example.com",
      password: "Study!With7Signals",
    });
  });

  it("keeps the non-secret fields so a rejected submission does not clear the form", () => {
    const formData = new FormData();
    formData.set("displayName", "Ada Learner");
    formData.set("email", "ada@example.com");
    formData.set("password", "Study!With7Signals");

    expect(retainedAuthValues(formData)).toEqual({
      displayName: "Ada Learner",
      email: "ada@example.com",
    });
  });

  it("never echoes the password back to the browser", () => {
    const formData = new FormData();
    formData.set("password", "Study!With7Signals");

    expect(JSON.stringify(retainedAuthValues(formData))).not.toContain("Study!With7Signals");
  });
});
