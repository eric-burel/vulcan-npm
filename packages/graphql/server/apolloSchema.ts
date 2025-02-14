/**
 * Finalize the graphql schema creation by adding
 * common elements to the model-based schema
 */
import { VulcanGraphqlModelServer } from "./typings";
import { parseAllModels } from "./parseAllModels";
import { defaultTypeDefs, defaultResolvers } from "./defaultSchema";
import { mergeResolvers } from "./utils";
import isEmpty from "lodash/isEmpty.js";

export const buildApolloSchema = (
  models: Array<VulcanGraphqlModelServer>
): {
  typeDefs: string;
  resolvers: any;
} /*IExecutableSchemaDefinition<any>*/ => {
  if (!models.length)
    throw new Error(
      "You need at least one Vulcan model when calling buildApolloSchema"
    );
  // TODO: merge all models
  const { resolvers, typeDefs } = parseAllModels(models);
  const mergedTypeDefs = `${defaultTypeDefs}
${typeDefs}`;
  const mergedResolvers = mergeResolvers([defaultResolvers, resolvers]);
  // Special case if there are no Query or Mutation content
  if (isEmpty(mergedResolvers.Query)) delete mergedResolvers.Query;
  if (isEmpty(mergedResolvers.Mutation)) delete mergedResolvers.Mutation;

  return {
    resolvers: mergedResolvers,
    typeDefs: mergedTypeDefs,
  };
};
