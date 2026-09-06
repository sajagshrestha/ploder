import assert from "node:assert/strict";
import test from "node:test";
import { readOverlayValue } from "./use-overlay-state";

test("overlay value reads string args", () => {
  assert.equal(
    readOverlayValue({ overlay: "preview", overlayArg: "123" }, "preview"),
    "123",
  );
});

test("overlay value coerces router-parsed numeric args", () => {
  // The router JSON-parses query values, so ?overlayArg=123 arrives as 123.
  assert.equal(
    readOverlayValue({ overlay: "preview", overlayArg: 123 }, "preview"),
    "123",
  );
});

test("overlay without an arg reads as empty string", () => {
  assert.equal(readOverlayValue({ overlay: "menu" }, "menu"), "");
});

test("other overlays read as closed", () => {
  assert.equal(readOverlayValue({ overlay: "menu" }, "appearance"), null);
  assert.equal(readOverlayValue({}, "menu"), null);
});

test("non-string non-numeric args read as empty string", () => {
  assert.equal(
    readOverlayValue({ overlay: "preview", overlayArg: ["1", "2"] }, "preview"),
    "",
  );
});
