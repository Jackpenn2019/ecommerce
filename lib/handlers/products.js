/*
 * Request handlers
 *
 */

//Dependencies
const _data = require("../data");
const helpers = require("../helpers");
const config = require("../config");
const controlCard = require("../controlcard");
//define handlers
const handlers = {};

//define the container for the user sub methods
handlers.post = {};
handlers.get = {};
handlers.put = {};
handlers.delete = {};

//POST - productCategories
//required fields: name,category,description,price,inStock,userId, token
//only authenticated Admin user can add products

handlers.post.createProduct = (data, callback) => {
  const token =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 20
      ? data.headers.token.trim()
      : false;

  const userId =
    typeof data.payload.userId == "string" &&
    data.payload.userId.trim().length > 4
      ? data.payload.userId.trim()
      : false;

  const name = typeof data.payload.name == "string" ? data.payload.name : false;

  const category =
    typeof data.payload.category == "string" &&
    data.payload.category.trim().length > 4
      ? data.payload.category.trim()
      : false;

  const inStock = typeof data.payload.inStock == "boolean" ? true : false;

  const description =
    typeof data.payload.description == "string" &&
    data.payload.description.trim().length > 5
      ? data.payload.description.trim()
      : false;

  const price =
    typeof data.payload.price == "number" ? data.payload.price : false;

  if (token && userId && name && category && description && price) {
    //fetch user by id
    _data.listAll("users", (err, data) => {
      if (!err && data) {
        const user = data.find((user) => user._id == userId);
        if (user && user.userType == 1) {
          //check if token is valid
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              _data.read("products", name, (err, data) => {
                if (err) {
                  controlCard.checkCounter((data) => {
                    if (data) {
                      const objectId = helpers.createObjectId(data.count);
                      if (objectId) {
                        //create category cobject
                        const currentDate = new Date();
                        const productObject = {
                          _id: objectId,
                          name: name,
                          description: description,
                          category: category,
                          price: price,
                          inStock: inStock,
                          createdBy: userId,
                          createdAt: currentDate.toISOString(),
                          updatedAt: "",
                        };
                        //save the category
                        _data.create(
                          "products",
                          objectId,
                          productObject,
                          (err) => {
                            if (!err) {
                              callback(200, productObject);
                            } else {
                              console.log(err);
                              callback(500, {
                                Error: "Could not create product",
                              });
                            }
                          }
                        );
                      } else {
                        callback(500, { Error: "Could not create object ID" });
                      }
                    } else {
                      callback(500, { Error: "Could not fetch ID counters" });
                    }
                  });
                } else {
                  callback(500, {
                    Error: "Product with that name already exists",
                  });
                }
              });
            } else {
              callback(500, { Error: "Token is invalid" });
            }
          });
        } else {
          callback(500, { Error: "Admin resource, unauthorized access" });
        }
      } else {
        callback(500, { Error: "Could not fetch the list of users" });
      }
    });
  } else {
    callback(200, { Error: "some mandatory fields are missing" });
  }
};

//Get method for products
//path : /products/find
//if product id is provided fetch by id, else fetch all
handlers.get.getProduct = (data, callback) => {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length > 4
      ? data.queryStringObject.id
      : false;
  //fetch all products
  _data.listAll("products", (err, data) => {
    if (!err && data) {
      //check if id is present
      if (id) {
        //get product by id only
        const product = data.find((p) => p._id == id);
        if (product) {
          callback(200, product);
        } else {
          callback(500, {
            Error: "Could not find a product by the ID provided",
          });
        }
      } else {
        //send all the products
        callback(200, data);
      }
    } else {
      callback(500, { Error: "Could not fetch the product list" });
    }
  });
};

handlers.put.updateProduct = (data, callback) => {
  const token =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 20
      ? data.headers.token.trim()
      : false;

  const userId =
    typeof data.payload.userId == "string" &&
    data.payload.userId.trim().length > 4
      ? data.payload.userId.trim()
      : false;

  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length > 4
      ? data.queryStringObject.id.trim()
      : false;

  const name = typeof data.payload.name == "string" ? data.payload.name : false;

  const category =
    typeof data.payload.category == "string" &&
    data.payload.category.trim().length > 4
      ? data.payload.category.trim()
      : false;
  console.log(typeof data.payload.inStock);
  console.log(data.payload.inStock);
  const inStock =
    typeof data.payload.inStock == "boolean" ? data.payload.inStock : false;

  const description =
    typeof data.payload.description == "string" &&
    data.payload.description.trim().length > 5
      ? data.payload.description.trim()
      : false;

  const price =
    typeof data.payload.price == "number" ? data.payload.price : false;

  if (token && userId && id) {
    if (name || category || description || price || inStock) {
      //fetch user by id
      _data.listAll("users", (err, data) => {
        if (!err && data) {
          const user = data.find((user) => user._id == userId);
          if (user && user.userType == 1) {
            //check if token is valid
            controlCard.verifyToken(token, user._id, (tokenIsValid) => {
              if (tokenIsValid) {
                //find the product to update by ID
                _data.listAll("products", (err, data) => {
                  if (!err && data) {
                    const product = data.find((product) => product._id == id);
                    if (product) {
                      //update the provided fields

                      if (description) {
                        product.description = description;
                      }
                      if (price) {
                        product.price = price;
                      }
                      /*   if (typeof inStock == "boolean") {
                        product.inStock = inStock;
                      }
                   */
                      if (category) {
                        product.category = category;
                      }
                      //update the updatedAt Timestamps
                      const currentDate = new Date();
                      product.updatedAt = currentDate.toISOString();

                      //update the new fields
                      _data.update("products", product._id, product, (err) => {
                        if (!err) {
                          callback(200, product);
                        } else {
                          console.log(err);
                          callback(500, {
                            Error: "Could not update the product",
                          });
                        }
                      });
                    } else {
                      callback(500, {
                        Error: "Could not find a product by the specified ID",
                      });
                    }
                  } else {
                    callaback(500, {
                      Error: "Could not fetch the products list",
                    });
                  }
                });
              } else {
                callback(500, { Error: "Token is invalid" });
              }
            });
          } else {
            callback(500, { Error: "Admin resource, unauthorized access" });
          }
        } else {
          callback(500, { Error: "Could not fetch the list of users" });
        }
      });
    } else {
      callback(200, {
        Error: "At least one field should be provided to update",
      });
    }
  } else {
    callback(400, { error: "Some mandatory fields are missing" });
  }
};

//delete methods for products
//required fields: id, userId,token
//only authenticated admin user can delete product
handlers.delete.removeProduct = (data, callback) => {
  //check for required fields
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length > 4
      ? data.payload.id.trim()
      : false;

  const userId =
    typeof data.queryStringObject.userId == "string" &&
    data.queryStringObject.userId.trim().length > 4
      ? data.queryStringObject.userId.trim()
      : false;

  const token =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 20
      ? data.headers.token.trim()
      : false;

  if (id && userId && token) {
    //check if requeting user is admin
    _data.listAll("users", (err, userData) => {
      if (!err && userData) {
        const user = userData.find((user) => user._id == userId);
        if (user && user.userType == 1) {
          //verify the token
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              //check if product to be deleted exists
              _data.listAll("products", (err, productData) => {
                if (!err && productData) {
                  const product = productData.find(
                    (product) => product._id == id
                  );
                  if (product) {
                    _data.delete("products", id, (err) => {
                      if (!err) {
                        callback(200, {
                          Message: `Product ${id} successfully deleted`,
                        });
                      } else {
                        callback(500, {
                          Error: "Could not delete the product",
                        });
                      }
                    });
                  } else {
                    callback(500, {
                      Error: "Could not find product to delete",
                    });
                  }
                } else {
                  callback(500, {
                    Error: "Could not fetch list of products",
                  });
                }
              });
            } else {
              callback(500, { Error: "Token is invalid or expired" });
            }
          });
        } else {
          callback(500, { Error: "Admin resource, unauthorized access" });
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

//export the module
module.exports = handlers;
