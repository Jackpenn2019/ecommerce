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

//define the container for the user sub methods
handlers.post = {};
handlers.get = {};
handlers.put = {};
handlers.delete = {};

//POST - productCategories
//required fields:
//only authenticated Admin user can add categories

handlers.post.createCategory = (data, callback) => {
  //check for mandatory data
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 4
      ? data.payload.email
      : false;

  const token =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 20
      ? data.headers.token.trim()
      : false;
  const name =
    typeof data.payload.name == "string" ? data.payload.name.trim() : false;

  if (token && email && name) {
    controlCard.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        counters.checkUserType(email, (userIsAdmin) => {
          if (userIsAdmin) {
            _data.read("categories", name, (err, data) => {
              if (err) {
                controlCard.checkCounter((data) => {
                  if (data) {
                    const objectId = helpers.createObjectId(data.count);
                    if (objectId) {
                      //create category cobject
                      const currentDate = new Date();
                      const categoryObject = {
                        _id: objectId,
                        name: name,
                        createdBy: email,
                        createdAt: currentDate.toISOString(),
                        updatedAt: "",
                      };
                      //save the category
                      _data.create(
                        "categories",
                        name,
                        categoryObject,
                        (err) => {
                          if (!err) {
                            callback(200, categoryObject);
                          } else {
                            console.log(err);
                            callback(500, {
                              Error: "Could not create category",
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
                  Error: "Category with that name already exists",
                });
              }
            });
          } else {
            callback(500, { Error: "Admin resource, unauthorized access" });
          }
        });
      } else {
        callback(500, { Error: "Provided token is invalid" });
      }
    });
  } else {
    callback(400, { Error: "Some required fields are missing" });
  }
};

//update method for category
//only category name can be updated
//only authenticated admin user can update category
handlers.put.updateCategory = (data, callback) => {
  callback(200, { message: "Howdy" });
};

//get method for product category
//@path /categories/find?id=categoryId
handlers.get.findCategory = (data, callback) => {
  //check for present fields
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length > 4
      ? data.queryStringObject.id.trim()
      : false;

  const name =
    typeof data.queryStringObject.name == "string" &&
    data.queryStringObject.name.trim().length > 4
      ? data.queryStringObject.name.trim()
      : false;

  if (name || id) {
    if (name) {
      _data.read("categories", name, (err, data) => {
        if (!err && data) {
          callback(200, data);
        } else {
          callback(500, { Error: "Could not fetch category by name" });
        }
      });
    } else {
      _data.listAll("categories", (err, data) => {
        if (!err && data) {
          const category = data.find((p) => p._id == id);
          if (category) {
            callback(200, category);
          } else {
            callback(500, { Error: "Could not find category by provided ID" });
          }
        } else {
          callback(500, { Error: "Could not fetch list of categories" });
        }
      });
    }
  } else {
    //fetch all categories without filter
    _data.listAll("categories", (err, data) => {
      if (!err && data) {
        callback(200, data);
      } else {
        callback(500, { Error: "Could not fetch the list of categories" });
      }
    });
  }
};

//@delete methods for categories
//@only authenticated admin user can delete category
//required fields: user token
handlers.delete.removeCategory = (data,callback)=>{
      //check for mandatory data
  const token =
  typeof data.headers.token == "string" &&
  data.headers.token.trim().length == 20
    ? data.headers.token.trim()
    : false;

const userid =
  typeof data.queryStringObject.userid == "string" &&
  data.queryStringObject.userid.trim().length > 4
    ? data.queryStringObject.userid.trim()
    : false;

const id =
  typeof data.queryStringObject.id == "string" &&
  data.queryStringObject.id.trim().length > 4
    ? data.queryStringObject.id.trim()
    : false;

if (userid && token && id) {
  //get user based on userid
  _data.listAll("users", (err, data) => {
    if (!err && data) {
      const user = data.find((user) => user._id == userid);
      if (user) {
        //check if token is valid for the user
        controlCard.verifyToken(token, user.email, (tokenIsValid) => {
          if (tokenIsValid) {
            //find the category by id
            _data.listAll("categories", (err, data) => {
              if (!err && data) {
                const category = data.find((category) => category._id == id);
                if (category) {
                  //Delete the category
                  _data.delete("categories", category.name, (err) => {
                    if (!err) {
                      callback(200, {
                        Message: "Category deleted successfully",
                      });
                    } else {
                      callback(500, { Error: "Could not delete category" });
                    }
                  });
                } else {
                  callback(500, {
                    Error: "Could not find category by provided ID",
                  });
                }
              } else {
                callback(500, {
                  Error: "Could not fetch the list of categories",
                });
              }
            });
          } else {
            callback(500, { Error: "Token is invalid" });
          }
        });
      } else {
        callback(500, { Error: "Could not find user by provided ID" });
      }
    } else {
      callback(500, { Error: "Could not fetch list of users" });
    }
  });
} else {
  callback(400, { Error: "Some mandatory fields are missing" });
}
}

handlers.notFound = (data, callback) => {
  callback(404, "Not found");
};
//export the module
module.exports = handlers;
