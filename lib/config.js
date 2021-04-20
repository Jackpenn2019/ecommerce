/*
 *
 *create and export environments configuration
 */

//instantiate the environment object
const environments = {};

//define the test environment
environments.test = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashingSecret: "LincyTheChamp",
  stripe: {
    authToken:
      "sk_test_51HpKKuG3io0NKTk7Itt45n7S7TjXAR4sFbcDDhlI9MYo6bXTvfMwvTJhRgNqrwwvuYSfmM264a43KqUcdktF1Ulg00fgOGlg73",
    accountId: "acct_1HpKKuG3io0NKTk7",
  },
  mailGun: {
    basicAuth: "api:c4f2ce1ef1ae9f0d7f28ee8c967edb9b-95f6ca46-d7c38390",
    from: "PizzaHut@testmail.com",
  },
};

//define production environment
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "staging",
  hashingSecret: "LincyTheChamp",
  stripe: {
    authToken:
      "sk_test_51HpKKuG3io0NKTk7Itt45n7S7TjXAR4sFbcDDhlI9MYo6bXTvfMwvTJhRgNqrwwvuYSfmM264a43KqUcdktF1Ulg00fgOGlg73",
    accountId: "acct_1HpKKuG3io0NKTk7",
  },
  mailGun: {
    basicAuth: "api:c4f2ce1ef1ae9f0d7f28ee8c967edb9b-95f6ca46-d7c38390",
    from: "PizzaHut@testmail.com",
  },
};

//decide which environment to use
const currentEnv =
  typeof process.env.NODE_ENV == "string"
    ? rocess.env.NODE_ENV.toLowerCase()
    : "";

//check that the current environment  is one of the above environments , else default to staging
const environmentToExport =
  typeof environments[currentEnv] == "object"
    ? environments[currentEnv]
    : environments.test;

//export the module
module.exports = environmentToExport;
