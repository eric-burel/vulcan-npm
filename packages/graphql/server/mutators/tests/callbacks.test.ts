import {
  createGraphqlModel,
  createGraphqlModelServer,
} from "../../../extendModel.server";
import { createMutator } from "@vulcanjs/crud/server";
import merge from "lodash/merge.js";
import { Connector } from "@vulcanjs/crud/server";

const schema = {
  _id: {
    type: String,
    canRead: ["guests"],
    optional: true,
  },
  createdAfter: {
    optional: true,
    type: Number,
    canRead: ["guests"],
  },
  createdBefore: {
    optional: true,
    type: Number,
    canRead: ["guests"],
  },
};
const defaultModelOptions = {
  schema,
  name: "Foo",
};
const membersPermissions = {
  canCreate: ["members"],
  canUpdate: ["members"],
  canDelete: ["members"],
};
const Foo = createGraphqlModel({
  ...defaultModelOptions,
  graphql: { typeName: "Foo", multiTypeName: "Foos" },
  permissions: membersPermissions,
});
const currentUser = { _id: "42" };

describe("create callbacks", () => {
  // create fake context
  const defaultPartialConnector: Partial<Connector> = {
    create: async () => ({ _id: "1" }),
    findOneById: async () => ({
      id: "1",
    }),
    findOne: async () => ({ id: "1" }),
    update: async () => ({ id: "1" }),
  };
  const defaultArgs = {
    model: Foo,
    data: {},
    validate: false,
    // we test while being logged out
    asAdmin: false,
    currentUser: null,
  };
  const createArgs = {
    ...defaultArgs,
  };
  // before
  test.skip("run before callback before document is saved", function () {
    // TODO get the document in the database
  });
  //after
  const modelGraphqlOptions = {
    typeName: "Foo",
    multiTypeName: "Foos",
  };
  describe("after", () => {
    test("run asynchronous 'after' callback before document is returned", async function () {
      const after = jest.fn(async (doc) => ({ ...doc, createdAfter: 1 }));
      const create = jest.fn(async (data) => ({ _id: 1, ...data }));
      const Foo = createGraphqlModelServer({
        schema,
        name: "Foo",
        graphql: merge({}, modelGraphqlOptions, {
          callbacks: {
            create: {
              after: [after],
            },
          },
        }),
        permissions: membersPermissions,
      });
      Foo.crud.connector = {
        ...defaultPartialConnector,
        create,
      } as Connector;
      const data = {};
      const { data: resultDocument } = await createMutator({
        ...createArgs,
        model: Foo,
        currentUser,
        data,
      });
      expect((create.mock.calls[0] as any)[0]).toEqual(data); // callback is NOT yet acalled
      expect(after).toHaveBeenCalledTimes(1);
      expect(resultDocument.createdAfter).toBe(1); // callback is called
    });
  });
  describe("before", () => {
    test("run asynchronous 'before' callback before document is saved", async function () {
      const before = jest.fn(async (doc) => ({ ...doc, createdBefore: 1 }));
      const create = jest.fn(async (data) => ({ _id: 1, ...data }));
      const Foo = createGraphqlModelServer({
        schema,
        name: "Foo",
        graphql: merge({}, modelGraphqlOptions, {
          callbacks: {
            create: {
              before: [before],
            },
          },
        }),
        permissions: membersPermissions,
      });
      Foo.crud.connector = {
        ...defaultPartialConnector,
        create,
      } as Connector;
      const data = {};
      const { data: resultDocument } = await createMutator({
        ...createArgs,
        model: Foo,
        currentUser,
        data,
      });
      const dataArg = (create.mock.calls[0] as any)[0];
      expect(dataArg).toEqual({
        ...data,
        createdBefore: 1,
      }); // callback is called already
      expect(before).toHaveBeenCalledTimes(1);
      expect(resultDocument.createdBefore).toBe(1); // callback is called
    });
  });
  describe("async", () => {
    test("run asynchronous side effect", async () => {
      // NOTE: if this test fails because of timeout => it means the mutator is waiting, while it should not
      const asyncLong = jest.fn(
        () =>
          new Promise((resolve, reject) =>
            setTimeout(() => resolve(true), 10000)
          )
      );
      const Foo = createGraphqlModelServer({
        ...defaultModelOptions,
        graphql: merge({}, modelGraphqlOptions, {
          callbacks: {
            create: {
              async: [asyncLong],
            },
          },
        }),
        permissions: membersPermissions,
      });
      Foo.crud.connector = {
        ...defaultPartialConnector,
      } as Connector;
      const data = {};
      const { data: resultDocument } = await createMutator({
        ...createArgs,
        model: Foo,
        currentUser,
        data,
      });
      expect(asyncLong).toHaveBeenCalledTimes(1);
    });
  });
  describe("validate", () => {
    test("return a custom validation error", async () => {
      const errSpy = jest
        .spyOn(console, "error")
        .mockImplementationOnce(() => {}); // silences console.error
      const validate = jest.fn(() => ["ERROR"]);
      const Foo = createGraphqlModelServer({
        ...defaultModelOptions,
        graphql: merge({}, modelGraphqlOptions, {
          callbacks: {
            create: {
              validate: [validate],
            },
          },
        }),
        permissions: membersPermissions,
      });
      Foo.crud.connector = {
        ...defaultPartialConnector,
      } as Connector;
      const data = {};

      expect.assertions(2); // should throw 1 exception
      try {
        const { data: resultDocument } = await createMutator({
          ...createArgs,
          model: Foo,
          currentUser,
          data,
          validate: true, // enable document validation
        });
      } catch (e) {}
      expect(validate).toHaveBeenCalledTimes(1);
      expect(errSpy).toHaveBeenCalled();
    });
  });
});
