const test = require("node:test");
const assert = require("node:assert/strict");

const WardrobeItem = require("../models/WardrobeItem");
const {
  createWardrobeItem,
  deleteWardrobeItem,
  updateWardrobeItem,
} = require("./wardrobeController");

const responseMock = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("wardrobe item create, edit, delete, and owner-scoped access use customer ownership", async () => {
  const originalCreate = WardrobeItem.create;
  const originalFindOne = WardrobeItem.findOne;
  const originalFindOneAndDelete = WardrobeItem.findOneAndDelete;
  const ownerId = "65f000000000000000000001";
  const itemId = "65f000000000000000000002";
  const res = responseMock();
  let createData;
  let updateFilter;
  let deleteFilter;

  try {
    WardrobeItem.create = async (data) => {
      createData = data;
      return { ...data, _id: itemId };
    };
    await createWardrobeItem(
      {
        body: { name: "Cotton Shirt", category: "shirts", color: "white" },
        user: { id: ownerId },
      },
      res,
      (error) => {
        throw error;
      },
    );
    assert.equal(res.statusCode, 201);
    assert.equal(createData.user, ownerId);

    WardrobeItem.findOne = async (filter) => {
      updateFilter = filter;
      return {
        _id: itemId,
        user: ownerId,
        name: "Old shirt name",
        imagePublicId: "",
        save: async function save() {
          return this;
        },
      };
    };
    const editResponse = responseMock();
    await updateWardrobeItem(
      { params: { id: itemId }, user: { id: ownerId }, body: { name: "Interview Shirt" } },
      editResponse,
      (error) => {
        throw error;
      },
    );
    assert.equal(updateFilter.user, ownerId);
    assert.equal(editResponse.body.item.name, "Interview Shirt");

    WardrobeItem.findOneAndDelete = async (filter) => {
      deleteFilter = filter;
      return null;
    };
    const deniedResponse = responseMock();
    let deniedError;
    await deleteWardrobeItem(
      { params: { id: itemId }, user: { id: "65f000000000000000000003" } },
      deniedResponse,
      (error) => {
        deniedError = error;
      },
    );
    assert.equal(deleteFilter.user, "65f000000000000000000003");
    assert.equal(deniedError.statusCode, 404);

    WardrobeItem.findOneAndDelete = async (filter) => {
      deleteFilter = filter;
      return { _id: itemId, user: ownerId, imagePublicId: "" };
    };
    const deleteResponse = responseMock();
    await deleteWardrobeItem(
      { params: { id: itemId }, user: { id: ownerId } },
      deleteResponse,
      (error) => {
        throw error;
      },
    );
    assert.equal(deleteFilter.user, ownerId);
    assert.equal(deleteResponse.body.deleted, true);
  } finally {
    WardrobeItem.create = originalCreate;
    WardrobeItem.findOne = originalFindOne;
    WardrobeItem.findOneAndDelete = originalFindOneAndDelete;
  }
});
