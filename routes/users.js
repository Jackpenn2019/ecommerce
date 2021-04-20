const handlers = require("../lib/handlers/users");

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
    handler: handlers.post.createUser,
  },
  find: {
    method: "get",
    handler: handlers.get.findUser,
  },
  update: {
    method: "put",
    handler: handlers.put.updateUser,
  },
  delete: {
    method: "delete",
    handler: handlers.delete.deleteUser,
  },
};

//export the module
module.exports = router;
