const handlers = require("../lib/handlers/products");

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
  create: {
    method: "post",
    handler: handlers.post.createProduct,
  },
  find: {
    method: "get",
    handler: handlers.get.getProduct,
  },
  update: {
    method: "put",
    handler: handlers.put.updateProduct,
  },
  delete: {
    method: "delete",
    handler: handlers.delete.removeProduct
  },
  token: {
    method: "post",
    handler: handlers.post.createToken,
  }
};

//export the module
module.exports = router;
