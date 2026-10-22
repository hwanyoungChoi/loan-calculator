import { describe, expect, it } from "vitest";

import { toOcrProgress } from "./ocrSession";

describe("toOcrProgress (AC-3)", () => {
  it.each([
    { status: "recognizing text", progress: 0.4, expected: { phase: "recognizing", ratio: 0.4 } },
    { status: "loading tesseract core", progress: 0.5, expected: { phase: "preparing" } },
    { status: "initializing tesseract", progress: 1, expected: { phase: "preparing" } },
    { status: "loading language traineddata", progress: 0.5, expected: { phase: "preparing" } },
    { status: "initializing api", progress: 0, expected: { phase: "preparing" } },
    { status: "알 수 없는 단계", progress: 0.7, expected: { phase: "preparing" } },
  ])("$status → $expected.phase", ({ status, progress, expected }) => {
    expect(toOcrProgress({ status, progress })).toEqual(expected);
  });
});
