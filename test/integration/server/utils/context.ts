/**
 * Context creation, for graphql but also REST endpoints
 */
import { Connector, VulcanGraphqlModel } from "@vulcanjs/graphql/server";

import { createMongooseConnector } from "@vulcanjs/mongo";
import { Request } from "express";
import debug from "debug";
const debugGraphqlContext = debug("vn:graphql:context");

/**
const models = [Tweek, Twaik];
 * Expected shape of the context
 * {
 *    "Foo": {
 *      model: Foo,
 *      connector: FooConnector
 *    }
 * }
 */
interface ModelContext {
  [typeName: string]: { model: VulcanGraphqlModel; connector: Connector };
}
/**
 * Build a default graphql context for a list of models
 * @param models
 */
const createContextForModels = (
  models: Array<VulcanGraphqlModel>
): ModelContext => {
  return models.reduce(
    (context, model: VulcanGraphqlModel) => ({
      ...context,
      [model.name]: {
        model,
        connector: createMongooseConnector(model),
      },
    }),
    {}
  );
};

// TODO: isolate context creation code like we do in Vulcan + initialize the currentUser too
export const contextBase = (models) => ({
  ...createContextForModels(models),
  /*
  // add some custom context here
  [User.graphql.typeName]: {
    model: User,
    connector: UserConnector, // we use the premade connector
  },
  */
});

/*
interface UserContext {
  userId?: string;
  currentUser?: UserType;
}
*/

/*
const userContextFromReq = async (
  req: Request
): Promise<UserContext> => {
  const session = await getSession(req);
  if (!session) return {};
  // Refetch the user from db in order to get the freshest data
  const user = await UserConnector.findOneById(session._id);
  if (user) {
    return { userId: user._id, currentUser: user };
  }
  return {};
};
*/
export const contextFromReq = (models) => async (req: Request) => {
  //const userContext = await userContextFromReq(req);
  const context = {
    ...contextBase,
    //  ...userContext,
  };
  debugGraphqlContext("Graphql context for current request:", context);
  return context;
};
