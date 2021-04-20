const handlers = require("../lib/handlers/frontend");

const router = (data, callback) => {
  //const trimmedPathArray = data.trimmedPath.split("/");
  const acceptableMethods = ["get", "post", "put", "delete"];
  //check if method on request is among list of acceptable methods
  if (acceptableMethods.indexOf(data.method) > -1) {
    let chosenHandler =
      typeof router.routes[data.trimmedPath] !== "undefined" &&
      data.method == router.routes[trimmedPath].method
        ? router.routes[trimmedPath].handler
        : handlers.notFound;
    chosenHandler(data, callback);
  } else {
    callback(405);
  }
};

router.routes = {
  create: {
    method: "post",
    handler: handlers.post.createCart,
  },
  find: {
    method: "get",
    handler: handlers.get.fetchCart,
  },
  update: {
    method: "put",
    handler: handlers.put.updateCart,
  },
  delete: {
    method: "delete",
    handler: handlers.delete.removeCart
  },
};

//export the module
module.exports = router;