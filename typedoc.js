module.exports = {
  name: "Vulcan NPM",
  entryPoints: [
    // don't forget to list twice packages that have a server/client/common export
    "packages/graphql/index.ts",
    "packages/graphql/server/index.ts",
    "packages/graphql/testing.ts",
    "packages/crud/index.ts",
    "packages/crud/server/index.ts",
    "packages/i18n/index.ts",
    "packages/i18n/server/index.ts",
    "packages/mdx/index.ts",
    "packages/meteor-legacy/index.ts",
    "packages/model/index.ts",
    "packages/mongo/index.ts",
    "packages/mongo/client/index.ts",
    "packages/mongo-apollo/index.ts",
    "packages/permissions/index.ts",
    "packages/react-hooks/index.ts",
    "packages/react-i18n/index.ts",
    "packages/react-ui/index.ts",
    "packages/react-ui/testing.ts",
    "packages/react-ui-bootstrap/index.ts",
    "packages/react-ui-lite/index.ts",
    "packages/react-ui-material/index.ts",
    "packages/remix-graphql/src/index.ts",
    "packages/schema/index.ts",
    "packages/utils/index.ts",
    "packages/utils/testing.ts",
  ],
  out: "generated/docs",
};
