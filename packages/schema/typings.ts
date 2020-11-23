/**
 * A Vulcan Schema as a JSON object
 *
 * /*\ this is not the simpl-schema processed version, but the definition
 */
import { SchemaDefinition, EvaluatedSchemaDefinition } from "simpl-schema";

export type FieldTypeName =
  | "String"
  | "Boolean"
  | "Number"
  | "SimpleSchema.Integer"
  | "Array"
  | "Object" // can be a nested schema OR a JSON in certain cases (depending on blackbox etc.)
  | "JSON" // explicitely a JSON
  | "Date";
type PermissionDefinition = String | Function;

type ContextWithUser = { currentUser?: any };

// TODO: did not manage to type the "model" field, because model depends on schema, so importing "VulcanModel" would create a circular dep
// This means that field callbacks probably belong to another intermediate package, for example vulcan-graphql
// (given that those callbacks are meant to be called by graphql mutators)
interface OnCreateInput<TModel = any> {
  // Data passed for creation
  data: Partial<TModel>;
  // originalData: VulcanDocument; // Data and original data are the same when this callback is called
  currentUser: any;
  model: any;
  context: ContextWithUser;
  schema: VulcanSchema;
}
interface OnUpdateInput<TModel = any> {
  // Data passed for
  data: Partial<TModel>; // VulcanDocument;
  // originalData: any;
  // Document from the database
  originalDocument: TModel;
  currentUser: any;
  model: any;
  context: ContextWithUser;
  schema: VulcanSchema;
}
interface OnDeleteInput<TModel = any> {
  // Document fetched from the database
  document: TModel;
  currentUser: any;
  model: any;
  context: ContextWithUser;
  schema: VulcanSchema;
}

// TODO: this also belong more to the concept of "Model" than "Schema"
interface Relation {
  fieldName: string;
  typeName: string;
  kind: "hasOne" | "hasMany";
}

interface VulcanField<TField = any> {
  canRead?: PermissionDefinition | Array<PermissionDefinition>;
  canCreate?: PermissionDefinition | Array<PermissionDefinition>;
  canUpdate?: PermissionDefinition | Array<PermissionDefinition>;
  blackbox?: boolean; // FIXME: we had to put it again because sometimes its not reckognized
  // viewableBy, Deprecated, do not exist anymore in Vulcan
  // insertableBy,
  // editableBy,
  // Field-level resolver
  resolveAs?: any;
  // TODO: review those fields
  // Field is hidden in forms
  hidden?: boolean;
  // "mustComplete", // mustComplete: true means the field is required to have a complete profile
  form?: any; // extra form properties
  inputProperties?: any; // extra form properties
  itemProperties?: any; // extra properties for the form row
  input?: "textarea" | any; // SmartForm control (String or React component)
  control?: any; // SmartForm control (String or React component) (legacy)
  order?: any; // position in the form
  group?: any; // form fieldset group
  arrayItem?: any; // properties for array items

  onCreate?: (input: OnCreateInput) => Promise<TField> | TField; // field insert callback, called server-side
  onUpdate?: (input: OnUpdateInput) => Promise<TField> | TField; // field edit callback, called server-side
  onDelete?: (input: OnDeleteInput) => Promise<void> | TField; // field remove callback, called server-side

  typeName?: string; // the GraphQL type to resolve the field with
  searchable?: boolean; // whether a field is searchable
  description?: string; // description/help
  beforeComponent?: any; // before form component
  afterComponent?: any; // after form component
  placeholder?: any; // form field placeholder value
  options?: any; // form options
  query?: string; // field-specific data loading query
  autocompleteQuery?: string; // query used to populate autocomplete
  selectable?: boolean; // field can be used as part of a selector when querying for data
  unique?: boolean; // field can be used as part of a selectorUnique when querying for data
  orderable?: boolean; // field can be used to order results when querying for data (backwards-compatibility)
  sortable?: boolean; // field can be used to order results when querying for data

  apiOnly?: boolean; // field should not be inserted in database
  relation?: Relation; // define a relation to another model

  intl?: boolean; // set to `true` to make a field international
  isIntlData?: boolean; // marker for the actual schema fields that hold intl strings
  intlId?: boolean; // set an explicit i18n key for a field
}
export interface VulcanFieldSchema<T = any>
  extends VulcanField,
    SchemaDefinition<T> {
  type: SchemaDefinition<any>["type"] | VulcanFieldSchema;
}

export type VulcanSchema = {
  [key: string]: VulcanFieldSchema;
};

/**
 * Version obtained after running new SimpleSchema({...})._schema
 * SHOULD BE USED SPARSELY
 */
// export interface VulcanFieldSchemaEvaluated<T = any>
//   extends EvaluatedSchemaDefinition,
//     VulcanField {}
// export type VulcanSchemaEvaluated = {
//   [key: string]: VulcanFieldSchemaEvaluated;
// };

/**
 * A Vulcan Document
 */
export interface VulcanDocument {
  // Special fields
  _id?: string;
  userId?: string;
  slug?: string;
  [key: string]: any;
}
