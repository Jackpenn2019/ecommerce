const handlers = require("../lib/handlers/categories");

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
    handler: handlers.post.createCategory,
  },
  find: {
    method: "get",
    handler: handlers.get.findCategory,
  },
  update: {
    method: "put",
    handler: handlers.put.updateCategory,
  },
  delete: {
    method: "delete",
    handler: handlers.delete.removeCategory
  },
};

//export the module
module.exports = router;
