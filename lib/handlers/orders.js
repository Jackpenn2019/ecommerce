//dependencies
const _data = require("../data");
const helpers = require("../helpers");
const config = require("../config");
const controlCard = require("../controlcard");

//container for the handlers
const handlers = {};

//containers for the sub methods
handlers.post = {};
handlers.get = {};
handlers.put = {};
handlers.delete = {};

//POST - handler to create the order
//required fields: userId, token,amount,address,transactionId
handlers.post.createOrder = (data, callback) => {
  const userId =
    typeof data.payload.userId == "string" &&
    data.payload.userId.trim().length > 5
      ? data.payload.userId
      : false;

  const amount =
    typeof data.payload.amount == "number" ? data.payload.amount : false;

  const token =
    typeof data.headers.token == "string" ? data.headers.token : false;

  //transaction ID sent from frontend is picked from response from stripe charge request
  const transactionId =
    typeof data.payload.transactionId == "string"
      ? data.payload.transactionId
      : false;

  const address =
    typeof data.payload.address == "string" ? data.payload.address : false;

  //check for mandatory fields

  if (userId && amount && token && transactionId && address) {
    //get user by userId
    _data.listAll("users", (err, data) => {
      if (!err && data) {
        const user = data.find((user) => user._id == userId);
        if (user) {
          //verify the token
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              //fetch the cart items for current user
              _data.read("carts", user._id, (err, cartData) => {
                if (!err && cartData && cartData.length > 0) {
                  //create the order object
                  controlCard.checkCounter((data) => {
                    if (data) {
                      const currentDate = new Date();
                      const objectId = helpers.createObjectId(data.count);
                      if (objectId) {
                        //by default when order is created status is received
                        const orderObject = {
                          _id: objectId,
                          amount: amount,
                          email: user.email,
                          user: user._id,
                          phone: user.phone,
                          cartItems: cartData,
                          createdAt: currentDate.toISOString(),
                          updatedAt: "",
                          status: "Received",
                        };
                        //create the order
                        _data.create("orders", objectId, orderObject, (err) => {
                          if (!err) {
                            //clear the cart
                            _data.update("carts", user._id, [], (err) => {
                              if (!err) {
                                //craft the payload for sending email
                                const emailData = {
                                  to: user.email,
                                  text: `Dear ${user.firstName}, your order at PizzaHut has been successfully placed. Total amount is ${amount}`,
                                };
                                //send the email
                                helpers.sendMailgunEmail(
                                  emailData,
                                  (err, response) => {
                                    if (!err) {
                                      callback(200, {
                                        Message: "Order processed successfully",
                                      });
                                    } else {
                                      callback(200, {
                                        Message:
                                          "order processed but email sending failed",
                                      });
                                    }
                                  }
                                );
                              } else {
                                callback(500, {
                                  Error:
                                    "Error happened while trying to clear the cart",
                                });
                              }
                            });
                          } else {
                            callback(500, {
                              Error: "Could not create the order",
                            });
                          }
                        });
                      } else {
                        callback(500, {
                          Error: "Could not create the object Id",
                        });
                      }
                    } else {
                      callback(500, {
                        Error: "Could not load the current counters",
                      });
                    }
                  });
                } else {
                  callback(500, {
                    Error:
                      "Could not fetch cart items for the user or cart is empty",
                  });
                }
              });
            } else {
              callback(500, { Error: "Token is invalid or expired" });
            }
          });
        } else {
          callback(500, { Error: "Could not find user by ID provided" });
        }
      } else {
        callback(500, { Error: "Could not fetch the users list" });
      }
    });
  } else {
    callback(400, { Error: "Some mandatory fields are missing" });
  }
};

//GET - method to fetch orders per user-id or all
//required fields: token, userId
//optional fields: findBy (if findBy = userId, get for specific user else get all orders)
handlers.get.findOrder = (data, callback) => {
  const userId =
    typeof data.queryStringObject.userId == "string"
      ? data.queryStringObject.userId
      : false;

  const token =
    typeof data.headers.token == "string" ? data.headers.token : false;

  const findBy =
    typeof data.queryStringObject.findBy == "string"
      ? data.queryStringObject.findBy
      : false;

  //check for mandatory fields
  if (userId && token) {
    //find user by id
    _data.listAll("users", (err, data) => {
      if (!err && data) {
        const user = data.find((user) => (user._id = userId));

        if (user) {
          //verify the token
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              //fetch the list of orders
              _data.listAll("orders", (err, orderData) => {
                if (!err && orderData) {
                  //find order by id
                  if (findBy && findBy == "userId") {
                    const orders = [];
                    orderData.map((p) => {
                      if (p.user == user._id) {
                        orders.push(p);
                      }
                    });
                    callback(200, orders);
                  } else {
                    //only admin user can fetch complete order list
                    if (user.userType == 1) {
                      callback(200, orderData);
                    } else {
                      console.log(user);
                      callback(400, {
                        Error: "Admin resource unauthorized access",
                      });
                    }
                  }
                } else {
                  callback(500, {
                    Error: "Could not fetch the list of orders",
                  });
                }
              });
            } else {
              callback(500, { Error: "Token is invalid or expired" });
            }
          });
        } else {
          callback(500, { Error: "Could not find the user by Id" });
        }
      } else {
        callback(500, { Error: "Could not fetch the list of users" });
      }
    });
  } else {
    callback(400, { Error: "Some required fields are missing" });
  }
};

//orders put method
//required data: userId,token, status,orderId
//optional data: none
//only admin user can update status of the order
handlers.put.updateOrder = (data, callback) => {
  const userId =
    typeof data.payload.userId == "string" ? data.payload.userId : false;

  const token =
    typeof data.headers.token == "string" ? data.headers.token : false;

  const orderId =
    typeof data.payload.orderId == "string" ? data.payload.orderId : false;

  const status =
    typeof data.payload.status == "string" ? data.payload.status : false;

  //check for mandatory fields
  if (userId && token && orderId && status) {
    //find the user by ID
    _data.listAll("users", (err, userData) => {
      if (!err && userData) {
        const user = userData.find((user) => user._id == userId);
        if (user && user.userType == 1) {
          //verify the token
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              //find the order by id
              _data.read("orders", orderId, (err, orderData) => {
                if (!err && orderData) {
                  //Check that new status is valid
                  const validStatuses = [
                    "Received",
                    "Preparation",
                    "Delivery",
                    "Delivered",
                  ];
                  if (validStatuses.indexOf(status) > -1) {
                    orderData.status = status;
                    //update the new data
                    _data.update("orders", orderId, orderData, (err) => {
                      if (!err) {
                        callback(200, orderData);
                      } else {
                        callback(500, {
                          Error: "Could not update the new status",
                        });
                      }
                    });
                  } else {
                    callback(500, { Error: "Invalid status provided" });
                  }
                } else {
                  callback(500, { Error: "Could not find order by ID" });
                }
              });
            } else {
              callback(500, { Error: "Token is invalid or expired" });
            }
          });
        } else {
          if (!user) {
            callback(500, { Error: "Could not find user by Id" });
          } else {
            callback(500, { Error: "Unauthorized access, Admin resource" });
          }
        }
      } else {
        callback(500, { Error: "Exception while fetching the list of users" });
      }
    });
  } else {
    callback(400, { Error: "Some required fields are missing" });
  }
};

//orders delete method
//required data: userId, token, orderId
//only admin user can delete an order
handlers.delete.deleteOrder = (data, callback) => {
  const userId =
    typeof data.payload.userId == "string" ? data.payload.userId : false;

  const token =
    typeof data.headers.token == "string" ? data.headers.token : false;

  const orderId =
    typeof data.payload.orderId == "string" ? data.payload.orderId : false;

  if (userId && token && orderId) {
    //find the user by id
    _data.listAll("users", (err, userData) => {
      if (!err && userData) {
        const user = userData.find((user) => user._id == userId);
        if (user && user.userType == 1) {
          //verify the token
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              //find the order to delete
              _data.read("orders", orderId, (err, orderData) => {
                if (!err && orderData) {
                  //delete the order
                  _data.delete("orders", orderId, (err) => {
                    if (!err) {
                      callback(200, { Message: "Order deleted successfully" });
                    } else {
                      callback(500, {
                        Error: "Error while deleting the order",
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not find order to delete" });
                }
              });
            } else {
              callback(500, { Error: "Token is invalid or expired" });
            }
          });
        } else {
          if (!user) {
            callback(500, { Error: "Could not find the user by Id" });
          } else {
            callback(500, { Error: "Admin resource, access denied" });
          }
        }
      } else {
        callback(500, { Error: "Could not fetch the list of users" });
      }
    });
  } else {
    callback(500, { Error: "Some required fields are missing" });
  }
};

handlers.notFound = (data, callback) => {
  callback(404, "Not found");
};
module.exports = handlers;
