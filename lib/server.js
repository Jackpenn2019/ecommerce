/*
 *
 *Server-related tasks
 */

//dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const path = require("path");
const config = require("./config");
const userRoutes = require("../routes/users");
const tokenRoutes = require("../routes/tokens");
const categoryRoutes = require("../routes/categories");
const productRoutes = require("../routes/products");
const paymentRoutes = require("../routes/payments");
const cartRoutes = require("../routes/carts");
const orderRoutes = require("../routes/orders");
const frontendRoutes = require("../routes/frontend");
const helpers = require("./helpers");
const fs = require("fs");

//initialize the server object
const server = {};

//instantiate the httpserver
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

//instantiate the httpsServer

server.httpsServer = https.createServer(
  server.httpsServerOptions,
  (req, res) => {
    server.unifiedServer(req, res);
  }
);

//instatiating https server
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem")),
};

//Generic server for both http and https requests
server.unifiedServer = (req, res) => {
  //Get the request url
  const parsedUrl = url.parse(req.url, true);

  //get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");
  const trimmedPathArray = trimmedPath.split("/");

  console.log(trimmedPath);
  console.log(trimmedPathArray);

  //get the query string object
  const queryStringObject = parsedUrl.query;

  //get the request headers
  const headers = req.headers;

  //get the request method
  const method = req.method.toLowerCase();

  //get the request payload, if any is sent(collect as stream and coalesce)
  const decoder = new StringDecoder("utf-8");

  //choose appropriate handler based on request path
  let buffer = "";

  //on event called data, append to the buffer
  req.on("data", (data) => {
    //decode to utf-8 and append to the buffer
    buffer += decoder.write(data);
  });

  //on event called end,
  req.on("end", () => {
    buffer += decoder.end();
    //choose appropriate handler to call
    let chosenHandler;
    if (trimmedPathArray[0] === "api") {
      chosenHandler =
        typeof server.router.api[trimmedPathArray[1]] != "undefined"
          ? server.router.api[trimmedPathArray[1]]
          : server.router.notFound;
    } else {
      chosenHandler = frontendRoutes;

    //create the data to send to the handler
    const data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      headers: headers,
      method: method,
      payload: helpers.parseJsonToObject(buffer),
    };

    //route the request to the chosen handler
    chosenHandler(data, (statusCode, payLoad) => {
      //use the status code called back by the handler, or default to 200
      statusCode = typeof statusCode == "number" ? statusCode : 200;
      //use the status code called back by the handler, or default an empty object
      payLoad = typeof payLoad == "object" ? payLoad : {};
      //convert the payload to a string
      const payLoadString = JSON.stringify(payLoad);

      //return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payLoadString);

      //If response is 200 print green else print red
      if (statusCode == 200) {
        console.log(
          "\x1b[32m%s\x1b[0m",
          method.toUpperCase() + " /" + trimmedPath + " " + statusCode
        );
      } else {
        console.log(
          "\x1b[31m%s\x1b[0m",
          method.toUpperCase() + " /" + trimmedPath + " " + statusCode
        );
      }
    });
  });
};

//Define the request routers
server.router = {
  //for api routes
  api: {
    users: userRoutes,
    tokens: tokenRoutes,
    categories: categoryRoutes,
    products: productRoutes,
    payments: paymentRoutes,
    carts: cartRoutes,
    orders: orderRoutes
  },
  //all other routes here

};

//not found handler
server.router.notFound = function (data, callback) {
  callback(404);
};

//initialize the server
server.init = () => {
  //start the http server
  server.httpServer.listen(config.httpPort, () => {
    console.log(
      "\x1b[36m%s\x1b[0m",
      `HTTP Server is listening on port ${config.httpPort}`
    );
  });
  //start the https server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(
      "\x1b[35m%s\x1b[0m",
      `HTTPS Server is listening on port ${config.httpsPort}`
    );
  });
};

//export the module
module.exports = server;
