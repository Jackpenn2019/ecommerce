/*
 * Request handlers
 *
 */

//Dependencies
const _data = require("../data");
//const helpers = require("../helpers");
const helpers = require("../helpers");
//const { config } = require('process');
const config = require("../config");
const controlcard = require("../controlcard");
const controlCard = require("../controlcard");
//define handlers
const handlers = {};

//define the sub method containers

handlers.post = {};
handlers.get = {};
handlers.put = {};
handlers.delete = {};

handlers.post.createCart = (data, callback) => {
  const token =
    typeof data.headers.token == "string" ? data.headers.token : false;

  const userId =
    typeof data.payload.userId == "string" ? data.payload.userId : false;

  //cartItems is an array of item objects with item id and count
  const cartItems = Array.isArray(data.payload.cartItems)
    ? data.payload.cartItems
    : false;

  if (token && userId && cartItems) {
    _data.listAll("users", (err, data) => {
      if (!err && data) {
        const user = data.find((user) => user._id == userId);
        if (user) {
          //validate the token
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              //create the cart
              _data.create("carts", user._id, cartItems, (err) => {
                if (!err) {
                  callback(200, { Message: "Cart created" });
                } else {
                  callback(500, {
                    Error: "Could not create cart or cart already existing",
                  });
                }
              });
            } else {
              callback(500, { Error: "Token is not valid" });
            }
          });
        } else {
          callback(403, { Error: "Unauthorized access" });
        }
      } else {
        callback(500, { Error: "Could not fetch the list of users" });
      }
    });
  } else {
    callback(403, { Error: "Some mandatory fields are missing" });
  }
};

handlers.get.fetchCart = (data, callback) => {
  const token =
    typeof data.headers.token == "string" ? data.headers.token : false;

  const userId =
    typeof data.queryStringObject.userId == "string"
      ? data.queryStringObject.userId
      : false;

  if (token && userId) {
    _data.listAll("users", (err, data) => {
      if (!err && data) {
        const user = data.find((user) => user._id == userId);
        if (user) {
          //validate the token
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              //fetch the cart
              _data.read("carts", user._id, (err, cartData) => {
                if (!err && cartData) {
                  callback(200, cartData);
                } else {
                  callback(500, { Error: "Could not fetch cart for user" });
                }
              });
            } else {
              callback(500, { Error: "Token is not valid" });
            }
          });
        } else {
          callback(403, { Error: "Unauthorized access" });
        }
      } else {
        callback(500, { Error: "Could not fetch the list of users" });
      }
    });
  } else {
    callback(400, { Error: "Some mandatory fields are missing" });
  }
};

handlers.put.updateCart = (data, callback) => {
  const token =
    typeof data.headers.token == "string" ? data.headers.token : false;

  const userId =
    typeof data.payload.userId == "string" ? data.payload.userId : false;
  const cartItems =
    Array.isArray(data.payload.cartItems) && data.payload.cartItems.length > 0
      ? data.payload.cartItems
      : false;

  if (token && userId && cartItems) {
    _data.listAll("users", (err, data) => {
      if (!err && data) {
        const user = data.find((user) => user._id == userId);
        if (user) {
          //validate the token
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              //fetch the cart
              _data.read("carts", user._id, (err, cartData) => {
                if (!err && cartData) {
                  console.log(cartItems);
                  for (i = 0; i < cartItems.length; i++) {
                    const item = cartData.find(
                      (item) => item.objectId == cartItems[i].objectId
                    );
                    const x = cartData.indexOf(item);
                    if (item) {
                      //update the new count
                      if (cartItems[x].count == 0) {
                        cartData.splice(x, 1);
                      } else {
                        cartData[x].count = cartItems[i].count;
                      }
                    } else {
                      //add new item to the array
                      cartData.push(cartItems[i]);
                    }
                  }

                  _data.update("carts", user._id, cartData, (err) => {
                    if (!err) {
                      callback(200, { Message: "Cart updated successfully" });
                    } else {
                      callback(500, { Error: "Could not update cart" });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not fetch cart for user" });
                }
              });
            } else {
              callback(500, { Error: "Token is not valid" });
            }
          });
        } else {
          callback(403, { Error: "Unauthorized access" });
        }
      } else {
        callback(500, { Error: "Could not fetch the list of users" });
      }
    });
  } else {
    callback(400, { Error: "Some mandatory fields are missing" });
  }
};

handlers.notFound = (data, callback) => {
  callback(404, "Not found");
};

module.exports = handlers;
