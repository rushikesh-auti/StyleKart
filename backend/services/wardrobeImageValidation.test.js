const test = require("node:test");
const assert = require("node:assert/strict");

const { getWardrobeImageFormat } = require("./wardrobeImageValidation");

test("recognizes supported wardrobe image signatures", () => {
  assert.equal(
    getWardrobeImageFormat(Buffer.from([0xff, 0xd8, 0xff, 0x00])),
    "image/jpeg",
  );
  assert.equal(
    getWardrobeImageFormat(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    "image/png",
  );
  assert.equal(
    getWardrobeImageFormat(Buffer.from("RIFF0000WEBP")),
    "image/webp",
  );
  assert.equal(getWardrobeImageFormat(Buffer.from("not an image")), "");
});
