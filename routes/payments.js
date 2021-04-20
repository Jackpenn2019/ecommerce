const handlers = require("../lib/handlers/payments");

const router = (data, callback) => {
  const trimmedPathArray = data.trimmedPath.split("/");
  const acceptableMethods = ["get", "post", "put", "delete"];
  //check if method on request is among list of acceptable methods
  if (acceptableMethods.indexOf(data.method) > -1) {
    const chosenHandler =
      typeof router.routes[trimmedPathArray[2]] !== "undefined" &&
      data.method == router.routes[trimmedPathArray[2]].method
        ? router.routes[trimmedPathArray[2]].handler
        : handlers.notFound;
    chosenHandler(data, callback);
  } else {
    callback(405);
  }
};

router.routes = {
  token: {
    method: "post",
    handler: handlers.post.createToken,
  },
  charge: {
    method: "post",
    handler: handlers.post.createDebit,
  }
};

//export the module
module.exports = router;
