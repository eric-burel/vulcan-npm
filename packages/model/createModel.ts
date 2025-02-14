/**
 * Extendable Vulcan model creation
 *
 * End user is, usually, NOT supposed to use this.
 * @vulcanjs/graphql exports a simpler `createGraphqlModel` which is equivalent to Meteor collections
 */
import { VulcanModel, ModelPermissionsOptions } from "./typings";
import { VulcanSchema } from "@vulcanjs/schema";
import cloneDeep from "lodash/cloneDeep.js";

export type ExtendModelFunc<TExtended extends VulcanModel = VulcanModel> = (
  model: VulcanModel
) => TExtended;
export interface CreateModelOptions<TSchema = VulcanSchema> {
  schema: TSchema;
  name: string;
  permissions?: ModelPermissionsOptions;
  extensions?: Array<ExtendModelFunc>;
}

// extract array items recursively
// first level: foo.$; second level: foo.$.$; etc.
export const extractArrayItems = (schema, fieldName, arrayItem, level = 1) => {
  const delimiter = ".$";
  const key = fieldName + delimiter.repeat(level);
  schema[key] = arrayItem;
  if (arrayItem.arrayItem) {
    extractArrayItems(schema, fieldName, arrayItem.arrayItem, ++level);
  }
};

/**
 * Convert a schema definition to a valid Vulcan schema
 * => in Vulcan Next we correctly split apiSchema and dbSchema so almost no
 * need of such a function
 * +
 * we try to have a unified syntax for schema
 *
 * We convert to a valid Simple-Schema only has a last resort when
 * we actually need Simple-Schema (eg for validation)
 *
 * @deprecated Used only internally in Vulcan to parse "arrayItem".
 * If used in your app: use a server model instead of API schema ; use a custom
 * connector instead of dbSchema ; for other fields we parse them directly in createModel
 *
 * @param schema
 * @param apiSchema
 * @param dbSchema
 * @returns
 */
export const createSchema = (
  schema: VulcanSchema,
  apiSchema = {},
  dbSchema = {}
) => {
  let modifiedSchema = cloneDeep(schema);

  Object.keys(modifiedSchema).forEach((fieldName) => {
    const field = schema[fieldName];
    const { arrayItem, type, canRead } = field;

    /*
    // legacy
    if (field.resolveAs) {
      // backwards compatibility: copy resolveAs.type to resolveAs.typeName
      if (!field.resolveAs.typeName) {
        field.resolveAs.typeName = field.resolveAs.type;
      }
    }

    // legacy
    if (field.relation) {
      // for now, "translate" new relation field syntax into resolveAs
      const { typeName, fieldName, kind } = field.relation;
      field.resolveAs = {
        typeName,
        fieldName,
        relation: kind,
      };
    }
    */

    // find any field with an `arrayItem` property defined and add corresponding
    // `foo.$` array item field to schema
    if (arrayItem) {
      extractArrayItems(modifiedSchema, fieldName, arrayItem);
    }

    // for added security, remove any API-related permission checks from db fields
    /*
  const filteredDbSchema = {};
  const blacklistedFields = ["canRead", "canCreate", "canUpdate"];
  Object.keys(dbSchema).forEach((dbFieldName) => {
    filteredDbSchema[dbFieldName] = _omit(
      dbSchema[dbFieldName],
      blacklistedFields
    );
  });
  */
    // add dbSchema *after* doing the apiSchema stuff so we are sure
    // its fields are not exposed through the GraphQL API
    //modifiedSchema = { ...modifiedSchema, ...filteredDbSchema };
  });

  return modifiedSchema; //new SimpleSchema(modifiedSchema);
};

// It can return a raw or an extended model type
export const createModel = <TModelDefinition extends VulcanModel>(
  options: CreateModelOptions
): TModelDefinition => {
  const { schema, name, extensions = [], permissions = {} } = options;

  const model: VulcanModel = {
    schema: createSchema(schema),
    name,
    permissions,
    options,
  };

  const extendedModel = extensions.reduce(
    (currentExtendedModel, extendFunction) => {
      return extendFunction(currentExtendedModel);
    },
    model
  ) as TModelDefinition;
  return extendedModel;
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
