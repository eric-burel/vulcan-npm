/**
 * Create a Vulcan model with graphql capabilities
 *
 * Implementation is based on an extension system
 *
 * End user is supposed to use only the "createGraphqlModel" function
 */
import { VulcanGraphqlModel, VulcanGraphqlSchema } from "./typings";
import { VulcanModel, createModel, CreateModelOptions } from "@vulcanjs/model";
import {
  getDefaultFragmentText,
  getDefaultFragmentName,
} from "./fragments/defaultFragment";
import { camelCaseify } from "@vulcanjs/utils";
/**
 * Typing is tricky here:
 * - we want to tell the user when they tried to use a server-only field client-side, and point them to the right solution (type: never)
 * - we want the sever version to define those server only fields correctly (type: whatever)
 * - we want to define functions that accept any of those types (eg when they use only the shared fields)
 *
 * This type is meant for internal use
 *
 * This SO question is similar but all answsers break inheritance, using types instead of cleaner interfaces
 * @see https://stackoverflow.com/questions/41285211/overriding-interface-property-type-defined-in-typescript-d-ts-file
 */
export interface GraphqlModelOptions {
  typeName: string; // Canonical name of the model = its graphQL type name
  multiTypeName: string; // Plural version, to be defined manually (automated pluralization leads to unexpected results)
}
/**
 * This type is meant to be exposed in the "default", shared helper
 *
 * It adds "never" types to help the user detecting when they do something wrong (trying to define server fields client side)
 */
export interface GraphqlModelOptionsShared extends GraphqlModelOptions {
  /** This is a server-only field. Please use "createGraphqlModelServer" if you want to create a model server-side */
  queryResolvers?: never;
  /** This is a server-only field. Please use "createGraphqlModelServer" if you want to create a model server-side */
  mutationResolvers?: never;
  /** This is a server-only field. Please use "createGraphqlModelServer" if you want to create a model server-side */
  callbacks?: never;
}

/**
 * Plugin function that adds graphql options to a generic model
 *
 * NOTE: should not be used directly, prefer calling "createGraphqlModel"
 */
const extendModel =
  (options: GraphqlModelOptions) /*: ExtendModelFunc<VulcanGraphqlModel>*/ =>
  (model: VulcanModel): VulcanGraphqlModel => {
    const name = model.name;
    const { typeName = name, multiTypeName } = options;

    const singleResolverName = camelCaseify(typeName);
    const multiResolverName = camelCaseify(multiTypeName);

    // compute base properties
    const graphqlModel = {
      singleResolverName,
      multiResolverName,
      ...options,
    };
    // compute default fragment
    const extendedModel = {
      ...model,
      graphql: graphqlModel,
    };
    const defaultFragment = getDefaultFragmentText(extendedModel);
    const defaultFragmentName = getDefaultFragmentName(extendedModel);

    if (!defaultFragment) {
      // This can legitimately happen if the schema only have nested fields for instance
      // However, in the future, it would be better to guarantee that we can generate a default fragment
      // for all scenarios except actually empty schemas
      console.warn(
        `Could not generate a default fragment for type ${graphqlModel.typeName}.
        Please make at least one field of the model ${model.name} readable, using canRead.`
      );
    }

    const extendedGraphqlModel = {
      ...graphqlModel,
      defaultFragment,
      defaultFragmentName,
    };
    const finalModel: VulcanGraphqlModel = {
      ...model,
      graphql: extendedGraphqlModel,
    };
    return finalModel;
  };

export interface CreateGraphqlModelOptionsShared
  extends CreateModelOptions<VulcanGraphqlSchema> {
  // we use the "Shared" version of the type, that is meant to be used for exported functions
  // => it will display nicer messages when you try to mistakenly use a server-only field
  graphql: GraphqlModelOptionsShared;
}
/**
 * Definition of a model, to be passed to "createGraphqlModel"
 */
export type GraphqlModelDefinition = CreateGraphqlModelOptionsShared;

/**
 * Let's you create a full-fledged graphql model
 *
 * Equivalent to a Vulcan Meteor createCollection
 */
export const createGraphqlModel = (
  options: CreateGraphqlModelOptionsShared
): VulcanGraphqlModel => {
  // TODO:
  const { graphql, ...baseOptions } = options;
  const model = createModel({
    ...baseOptions,
    extensions: [extendModel(options.graphql)],
  }) as VulcanGraphqlModel;
  return model;
};

//// CODE FROM CREATE COLLECTION
//import { Mongo } from "meteor/mongo";
//import SimpleSchema from "simpl-schema";
// import escapeStringRegexp from "escape-string-regexp";
// import {
//   validateIntlField,
//   getIntlString,
//   isIntlField,
//   schemaHasIntlFields,
//   schemaHasIntlField,
// } from "./intl";
// import clone from "lodash/clone.js";
// import isEmpty from "lodash/isEmpty.js";
// import merge from "lodash/merge.js";
// import _omit from "lodash/omit.js";
// import mergeWith from "lodash/mergeWith.js";
// import { createSchema, isCollectionType } from "./schema_utils";

// // will be set to `true` if there is one or more intl schema fields
// export let hasIntlFields = false;

// // see https://github.com/dburles/meteor-collection-helpers/blob/master/collection-helpers.js
// Mongo.Collection.prototype.helpers = function (helpers) {
//   var self = this;

//   if (self._transform && !self._helpers)
//     throw new Meteor.Error(
//       "Can't apply helpers to '" +
//         self._name +
//         "' a transform function already exists!"
//     );

//   if (!self._helpers) {
//     self._helpers = function Document(doc) {
//       return Object.assign(this, doc);
//     };
//     self._transform = function (doc) {
//       return new self._helpers(doc);
//     };
//   }

//   Object.keys(helpers).forEach(function (key) {
//     self._helpers.prototype[key] = helpers[key];
//   });
// };

// export const extendCollection = (collection, options) => {
//   const newOptions = mergeWith({}, collection.options, options, (a, b) => {
//     if (Array.isArray(a) && Array.isArray(b)) {
//       return a.concat(b);
//     }
//     if (Array.isArray(a) && b) {
//       return a.concat([b]);
//     }
//     if (Array.isArray(b) && a) {
//       return b.concat([a]);
//     }
//   });
//   collection = createCollection(newOptions);
//   return collection;
// };

// /*

// Note: this currently isn't used because it would need to be called
// after all collections have been initialized, otherwise we can't figure out
// if resolved field is resolving to a collection type or not

// */
// export const addAutoRelations = () => {
//   Collections.forEach((collection) => {
//     const schema = collection.simpleSchema()._schema;
//     // add "auto-relations" to schema resolvers
//     Object.keys(schema).map((fieldName) => {
//       const field = schema[fieldName];
//       // if no resolver or relation is provided, try to guess relation and add it to schema
//       if (field.resolveAs) {
//         const { resolver, relation, type } = field.resolveAs;
//         if (isCollectionType(type) && !resolver && !relation) {
//           field.resolveAs.relation =
//             field.type === Array ? "hasMany" : "hasOne";
//         }
//       }
//     });
//   });
// };

// /*

// Pass an existing collection to overwrite it instead of creating a new one

// */
// export const createCollection = (options) => {
//   const {
//     typeName,
//     collectionName = generateCollectionNameFromTypeName(typeName),
//     dbCollectionName,
//   } = options;
//   let { schema, apiSchema, dbSchema } = options;

//   // decorate collection with options
//   collection.options = options;

//   // add views
//   collection.views = [];

//   //register individual collection callback
//   registerCollectionCallback(typeName.toLowerCase());

//   // if schema has at least one intl field, add intl callback just before
//   // `${collectionName}.collection` callbacks run to make sure it always runs last
//   if (schemaHasIntlFields(schema)) {
//     hasIntlFields = true; // we have at least one intl field
//     addCallback(`${typeName.toLowerCase()}.collection`, addIntlFields);
//   }

//   if (schema) {
//     // attach schema to collection
//     collection.attachSchema(createSchema(schema, apiSchema, dbSchema));
//   }

//   // ------------------------------------- Default Fragment -------------------------------- //

//   const defaultFragment = getDefaultFragmentText(collection);
//   if (defaultFragment) registerFragment(defaultFragment);

//   // ------------------------------------- Parameters -------------------------------- //

//   // legacy
//   collection.getParameters = (terms = {}, apolloClient, context) => {
//     // console.log(terms);

//     const currentSchema = collection.simpleSchema()._schema;

//     let parameters = {
//       selector: {},
//       options: {},
//     };

//     if (collection.defaultView) {
//       parameters = Utils.deepExtend(
//         true,
//         parameters,
//         collection.defaultView(terms, apolloClient, context)
//       );
//     }

//     // handle view option
//     if (terms.view && collection.views[terms.view]) {
//       const viewFn = collection.views[terms.view];
//       const view = viewFn(terms, apolloClient, context);
//       let mergedParameters = Utils.deepExtend(true, parameters, view);

//       if (
//         mergedParameters.options &&
//         mergedParameters.options.sort &&
//         view.options &&
//         view.options.sort
//       ) {
//         // If both the default view and the selected view have sort options,
//         // don't merge them together; take the selected view's sort. (Otherwise
//         // they merge in the wrong order, so that the default-view's sort takes
//         // precedence over the selected view's sort.)
//         mergedParameters.options.sort = view.options.sort;
//       }
//       parameters = mergedParameters;
//     }

//     // iterate over posts.parameters callbacks
//     parameters = runCallbacks(
//       `${typeName.toLowerCase()}.parameters`,
//       parameters,
//       clone(terms),
//       apolloClient,
//       context
//     );
//     // OpenCRUD backwards compatibility
//     parameters = runCallbacks(
//       `${collectionName.toLowerCase()}.parameters`,
//       parameters,
//       clone(terms),
//       apolloClient,
//       context
//     );

//     if (Meteor.isClient) {
//       parameters = runCallbacks(
//         `${typeName.toLowerCase()}.parameters.client`,
//         parameters,
//         clone(terms),
//         apolloClient
//       );
//       // OpenCRUD backwards compatibility
//       parameters = runCallbacks(
//         `${collectionName.toLowerCase()}.parameters.client`,
//         parameters,
//         clone(terms),
//         apolloClient
//       );
//     }

//     // note: check that context exists to avoid calling this from withList during SSR
//     if (Meteor.isServer && context) {
//       parameters = runCallbacks(
//         `${typeName.toLowerCase()}.parameters.server`,
//         parameters,
//         clone(terms),
//         context
//       );
//       // OpenCRUD backwards compatibility
//       parameters = runCallbacks(
//         `${collectionName.toLowerCase()}.parameters.server`,
//         parameters,
//         clone(terms),
//         context
//       );
//     }

//     // sort using terms.orderBy (overwrite defaultView's sort)
//     if (terms.orderBy && !isEmpty(terms.orderBy)) {
//       parameters.options.sort = terms.orderBy;
//     }

//     // if there is no sort, default to sorting by createdAt descending
//     if (!parameters.options.sort) {
//       parameters.options.sort = { createdAt: -1 };
//     }

//     // extend sort to sort posts by _id to break ties, unless there's already an id sort
//     // NOTE: always do this last to avoid overriding another sort
//     //if (!(parameters.options.sort && parameters.options.sort._id)) {
//     //  parameters = Utils.deepExtend(true, parameters, { options: { sort: { _id: -1 } } });
//     //}

//     // remove any null fields (setting a field to null means it should be deleted)
//     Object.keys(parameters.selector).forEach((key) => {
//       if (parameters.selector[key] === null) delete parameters.selector[key];
//     });
//     if (parameters.options.sort) {
//       Object.keys(parameters.options.sort).forEach((key) => {
//         if (parameters.options.sort[key] === null)
//           delete parameters.options.sort[key];
//       });
//     }

//     if (terms.query) {
//       const query = escapeStringRegexp(terms.query);
//       const searchableFieldNames = Object.keys(currentSchema).filter(
//         (fieldName) => currentSchema[fieldName].searchable
//       );
//       if (searchableFieldNames.length) {
//         parameters = Utils.deepExtend(true, parameters, {
//           selector: {
//             $or: searchableFieldNames.map((fieldName) => ({
//               [fieldName]: { $regex: query, $options: "i" },
//             })),
//           },
//         });
//       } else {
//         // eslint-disable-next-line no-console
//         console.warn(
//           `Warning: terms.query is set but schema ${collection.options.typeName} has no searchable field. Set "searchable: true" for at least one field to enable search.`
//         );
//       }
//     }

//     // limit number of items to 1000 by default
//     const maxDocuments = getSetting("maxDocumentsPerRequest", 1000);
//     const limit = terms.limit || parameters.options.limit;
//     parameters.options.limit =
//       !limit || limit < 1 || limit > maxDocuments ? maxDocuments : limit;

//     // console.log(JSON.stringify(parameters, 2));

//     return parameters;
//   };

//   if (existingCollection) {
//     Collections[existingCollectionIndex] = existingCollection;
//   } else {
//     Collections.push(collection);
//   }

//   return collection;
// };

// //register collection creation hook for each collection
// function registerCollectionCallback(typeName) {
//   registerCallback({
//     name: `${typeName}.collection`,
//     iterator: { schema: "the schema of the collection" },
//     properties: [
//       { schema: "The schema of the collection" },
//       {
//         validationErrors:
//           "An Object that can be used to accumulate validation errors",
//       },
//     ],
//     runs: "sync",
//     returns: "schema",
//     description: "Modifies schemas on collection creation",
//   });
// }

// //register colleciton creation hook
// registerCallback({
//   name: "*.collection",
//   iterator: { schema: "the schema of the collection" },
//   properties: [
//     { schema: "The schema of the collection" },
//     {
//       validationErrors:
//         "An object that can be used to accumulate validation errors",
//     },
//   ],
//   runs: "sync",
//   returns: "schema",
//   description: "Modifies schemas on collection creation",
// });

// // generate foo_intl fields
// export function addIntlFields(schema) {
//   Object.keys(schema).forEach((fieldName) => {
//     const fieldSchema = schema[fieldName];
//     if (isIntlField(fieldSchema) && !schemaHasIntlField(schema, fieldName)) {
//       // remove `intl` to avoid treating new _intl field as a field to internationalize
//       // eslint-disable-next-line no-unused-vars
//       const { intl, ...propertiesToCopy } = schema[fieldName];

//       schema[`${fieldName}_intl`] = {
//         ...propertiesToCopy, // copy properties from regular field
//         hidden: true,
//         type: Array,
//         isIntlData: true,
//       };

//       delete schema[`${fieldName}_intl`].intl;

//       schema[`${fieldName}_intl.$`] = {
//         type: getIntlString(),
//       };

//       // if original field is required, enable custom validation function instead of `optional` property
//       if (!schema[fieldName].optional) {
//         schema[`${fieldName}_intl`].optional = true;
//         schema[`${fieldName}_intl`].custom = validateIntlField;
//       }

//       // make original non-intl field optional
//       schema[fieldName].optional = true;
//     }
//   });
//   return schema;
// }

export default extendModel;
