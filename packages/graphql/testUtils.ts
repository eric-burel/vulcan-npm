import { graphql } from "msw";
// allow to easily test regex on a graphql string
// all blanks and series of blanks are replaces by one single space
export const normalizeGraphQLSchema = (gqlSchema) =>
  gqlSchema.replace(/\s+/g, " ").trim();

/**
 * The constraint on variables matching is lighter than official Apollo MockedProvider mocks
 *
 * See our custom mockGraphQL command for usage
 */
export interface GraphqlQueryStub<TData = any> {
  operationName: string; // name of the query to intercept
  response: { data: TData }; // the response
}
export interface GraphqlMutationStub<TData = any> {
  operationName: string; // name of the query to intercept
  response: { data: TData }; // the response
}

export const graphqlQueryStubsToMsw = (stubs: Array<GraphqlQueryStub>) => {
  return stubs.map((stub) => {
    const { operationName, response } = stub;
    return graphql.query(operationName, (req, res, ctx) => {
      return res(ctx.data(response.data));
    });
  });
};
export const graphqlMutationStubsToMsw = (
  stubs: Array<GraphqlMutationStub>
) => {
  return stubs.map((stub) => {
    const { operationName, response } = stub;
    return graphql.mutation(operationName, (req, res, ctx) => {
      return res(ctx.data(response.data));
    });
  });
};
