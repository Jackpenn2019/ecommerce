/*
 *
 *Primary file for the api
 */

//dependencies

const server = require("./lib/server");
const workers = require("./lib/workers");

//Declare the app object
const app = {};

//Initialize the app
app.init = () => {
  //start the server
  server.init();

  //start the background workers
  workers.init();
};

//call the function to start the app
app.init();

//Export the app module
module.exports = app;
