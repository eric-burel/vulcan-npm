/*

Differences with Vulcan Meteor:

- use models instead of collections, to stay isomorphic
- do not accept references for models and fragments (eg collectionName), you have to get the actual value beforehand
- no pattern to get settings: you have to pass the polling option each time (or create your own useMulti that extends this one). Defaults can't be overriden globally.
- deprecate "propertyName" => with hooks you can rename when consuming the hook instead
- automated pluralization is forbidden, eg in graphql templates 
=> user has to provide a multiTypeName in the model (could be improved but automated pluralization must be avoided)
*/

import { DocumentNode } from "graphql";
import { useQuery, QueryResult, QueryHookOptions } from "@apollo/client";
import gql from "graphql-tag";
import { useState } from "react";
import {
  multiClientTemplate,
  VulcanGraphqlModel,
  MultiVariables,
  MultiInput,
} from "@vulcanjs/graphql";
import merge from "lodash/merge.js";
import get from "lodash/get.js";

// default query input object
const defaultInput = {
  limit: 20,
  enableTotal: true,
  enableCache: false,
};

interface BuildMultiQueryArgs {
  model: VulcanGraphqlModel;
  fragmentName?: string;
  fragment?: string | DocumentNode;
  extraQueries?: string;
}
export const buildMultiQuery = ({
  model,
  fragmentName = model.graphql.defaultFragmentName,
  fragment = model.graphql.defaultFragment,
  extraQueries,
}: BuildMultiQueryArgs) => {
  const { typeName, multiTypeName } = model.graphql;
  return gql`
    ${multiClientTemplate({
      typeName,
      multiTypeName,
      fragmentName,
      extraQueries,
    })}
    ${fragment}
  `;
};
const getInitialPaginationInput = (options, props) => {
  // get initial limit from props, or else options, or else default value
  const limit =
    (props.input && props.input.limit) ||
    (options.input && options.input.limit) ||
    options.limit ||
    defaultInput.limit;
  const paginationInput = {
    limit,
  };
  return paginationInput;
};

/**
 * Build the graphQL query options
 * @param {*} options
 * @param {*} state
 * @param {*} props
 */
export const buildMultiQueryOptions = <TModel, TData>(
  options: Partial<UseMultiOptions<TModel, TData, MultiVariables>>,
  paginationInput: any = {},
  props
): Partial<QueryHookOptions<TData, MultiVariables>> => {
  let pollInterval: number | null = null;
  let {
    input: optionsInput,
    // generic graphQL options
    queryOptions = {},
  } = options;
  pollInterval = options.pollInterval ?? 20000; // nullish coalescing will keep the value 0, to deactivate polling explicitely

  // get dynamic input from props
  const { input: propsInput = {} } = props;

  // merge static and dynamic inputs
  const input = merge({}, optionsInput, propsInput);

  // if this is the SSR process, set pollInterval to null
  // see https://github.com/apollographql/apollo-client/issues/1704#issuecomment-322995855
  pollInterval = typeof window === "undefined" ? null : pollInterval;

  // get input from options, then props, then pagination
  // TODO: should be done during the merge with lodash
  const mergedInput: MultiInput = {
    ...defaultInput,
    ...options.input,
    ...input,
    ...paginationInput,
  };

  const graphQLOptions: Partial<QueryHookOptions<TData, MultiVariables>> = {
    variables: {
      input: mergedInput,
    },
    // note: pollInterval can be set to 0 to disable polling (20s by default)
    pollInterval: pollInterval ?? undefined,
  };

  // see https://www.apollographql.com/docs/react/features/error-handling/#error-policies
  queryOptions.errorPolicy = "all";

  return {
    ...graphQLOptions,
    ...queryOptions, // allow overriding options
  };
};

/**
 * Query updater after a fetch more
 * @param resolverName
 */
export const fetchMoreUpdateQuery =
  (resolverName: string) =>
  (previousResults, { fetchMoreResult }) => {
    // no more post to fetch
    if (!fetchMoreResult[resolverName]?.results?.length) {
      return previousResults;
    }
    const newResults = {
      ...previousResults,
      [resolverName]: { ...previousResults[resolverName] },
    };
    newResults[resolverName].results = [
      ...previousResults[resolverName].results,
      ...fetchMoreResult[resolverName].results,
    ];
    return newResults;
  };

const buildMultiResult = <TModel, TData, TVariables>(
  options: UseMultiOptions<TModel, TData, TVariables>,
  { fragmentName, fragment, resolverName },
  { setPaginationInput, paginationInput, initialPaginationInput },
  queryResult: QueryResult<TData>
): MultiQueryResult<TModel> => {
  //console.log('returnedProps', returnedProps);

  // workaround for https://github.com/apollographql/apollo-client/issues/2810
  const graphQLErrors = get(queryResult, "error.networkError.result.errors");
  const { refetch, networkStatus, error, fetchMore, data, loading, variables } =
    queryResult;
  // Note: Scalar types like Dates are NOT converted. It should be done at the UI level.
  // We are foreced to recast because resolverName is dynamic, so we cannot type "data" correctly yet
  const documents = data?.[resolverName]?.results as Array<TModel> | undefined;
  const totalCount = data?.[resolverName]?.totalCount as number | undefined;
  // see https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
  const loadingInitial = networkStatus === 1;
  const loadingMore = networkStatus === 3 || networkStatus === 2;

  return {
    ...queryResult,
    // see https://github.com/apollostack/apollo-client/blob/master/src/queries/store.ts#L28-L36
    // note: loading will propably change soon https://github.com/apollostack/apollo-client/issues/831
    loadingInitial,
    loadingMore,
    documents,
    totalCount,
    networkError: error && error.networkError,
    graphQLErrors,
    count: documents && documents.length,

    /**
     * User friendly wrapper around fetchMore
     * NOTE: this feature is not compatible with polling
     * @param providedInput
     */
    loadMore() {
      if (!documents) {
        if (loading) {
          throw new Error(
            "Called loadMore while documents were still loading. Please wait for the first documents to be loaded before loading more"
          );
        } else {
          throw new Error(
            "No 'documents' were returned by initial query (it probably failed with an error), impossible to call loadMore"
          );
        }
      }
      // get terms passed as argument or else just default to incrementing the offset
      if (options.pollInterval)
        throw new Error("Can't call loadMore when polling is set.");
      const offsetVariables = merge({}, variables, {
        input: {
          offset: documents.length,
        },
      });

      return fetchMore({
        variables: offsetVariables,
        updateQuery: fetchMoreUpdateQuery(resolverName),
      });
    },

    fragmentName,
    fragment,
    data,
  };
};

interface UseMultiOptions<TModel, TData, TVariables>
  // we support pollInterval at the root as a legacy behaviour
  extends Pick<QueryHookOptions<TData, TVariables>, "pollInterval"> {
  model: VulcanGraphqlModel;
  input?: MultiInput<TModel>;
  fragment?: string | DocumentNode;
  fragmentName?: string;
  extraQueries?: string; // Get more data alongside the objects
  queryOptions?: QueryHookOptions<TData, TVariables>;
} // & useQuery options?

export interface MultiQueryResult<TModel = any, TData = any>
  extends QueryResult<TData> {
  graphQLErrors: any;
  loadingInitial: boolean;
  loadingMore: boolean;
  loadMore: () => ReturnType<QueryResult<TData>["fetchMore"]>;
  //loadMoreInc: Function;
  totalCount?: number;
  count?: number;
  networkError?: any;
  graphqlErrors?: Array<any>;
  fragment: string;
  fragmentName: string;
  documents?: Array<TModel>;
}

export const useMulti = <TModel = any, TData = any>(
  options: UseMultiOptions<TModel, TData, MultiVariables>,
  props = {}
): MultiQueryResult<TModel, TData> => {
  const initialPaginationInput = getInitialPaginationInput(options, props);
  const [paginationInput, setPaginationInput] = useState(
    initialPaginationInput
  );

  let {
    model,
    fragment = model.graphql.defaultFragment,
    fragmentName = model.graphql.defaultFragmentName,
    extraQueries,
  } = options;

  const { multiResolverName: resolverName } = model.graphql;

  // build graphql query from options
  const query = buildMultiQuery({
    model,
    fragmentName,
    extraQueries,
    fragment,
  });

  const queryOptions = buildMultiQueryOptions<TModel, TData>(
    options,
    paginationInput,
    props
  );
  const queryResult = useQuery<TData>(query, queryOptions);

  const result = buildMultiResult<TModel, TData, MultiVariables>(
    options,
    { fragment, fragmentName, resolverName },
    { setPaginationInput, paginationInput, initialPaginationInput },
    queryResult
  );

  return result;
};
