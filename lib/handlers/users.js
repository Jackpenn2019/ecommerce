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

//Users post
//required fields: firstName,lastName,email(unique),userType(2 - normal user, 1 - admin user,default - 2),address,phone,password
handlers.post.createUser = (data, callback) => {

  console.log(data.payload)
  //check for mandatory fields
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName
      : false;
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 5
      ? data.payload.email
      : false;
  const userType =
    typeof data.payload.userType == "number" ? data.payload.userType : 2;
  const address =
    typeof data.payload.address == "string" &&
    data.payload.address.trim().length > 2
      ? data.payload.address
      : false;
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 12
      ? data.payload.phone.trim()
      : false;
  const tosAgreement =
    typeof data.payload.tosAgreement == "boolean" ? true : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false;
  //check that all mandatory fields are provided
  if (
    firstName &&
    lastName &&
    email &&
    userType &&
    phone &&
    address &&
    tosAgreement &&
    password
  ) {
    //check that user is not already existing based on email
    _data.listAll("users", (err, data) => {
      if (!err && data) {
        const user = data.find((user) => user.email == email);
        if (!user) {
          controlCard.checkCounter((data) => {
            if (data) {
              const currentDate = new Date();
              const hashedPassword = helpers.hash(password);
              const objectId = helpers.createObjectId(data.count);
              if (hashedPassword && objectId) {
                const userObject = {
                  _id: objectId,
                  firstName: firstName,
                  lastName: lastName,
                  userType: userType,
                  phone: phone,
                  email: email,
                  hashedPassword: hashedPassword,
                  tosAgreement: true,
                  createdAt: currentDate.toISOString(),
                  updatedAt: "",
                };
                //store the user
                _data.create("users", objectId, userObject, (err) => {
                  if (!err) {
                    //create an empty cart by default for the user
                    const cart = [];
                    _data.create("carts", objectId, cart, (err) => {
                      if (!err) {
                        delete userObject.hashedPassword;
                        callback(200, userObject);
                      } else {
                        callback(500, {
                          Error: "User created but could not create cart",
                        });
                      }
                    });
                  } else {
                    callback(500, { Error: "Could not create the new user" });
                  }
                });
              } else {
                callback(500, {
                  Error: "Could not hash password or create object Id",
                });
              }
            } else {
              callback(500, { Error: "Could not fetch counters" });
            }
          });
        } else {
          callback(500, { Error: "user with that email already exists" });
        }
      } else {
        callback(500, { Error: "Could not fetch list of users" });
      }
    });
  } else {
    callback(400, { Error: "Some mandatory fields are missing" });
  }
};

//Users - get
//required data: tokenId, email

handlers.get.findUser = (data, callback) => {
  //check for mandatory data
  const email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 4
      ? data.queryStringObject.email.trim()
      : false;

  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length > 4
      ? data.queryStringObject.id.trim()
      : false;

  const token =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 20
      ? data.headers.token.trim()
      : false;

  if (id && token) {
    _data.listAll("users", (err, data) => {
      if (!err && data) {
        const user = data.find((user) => user._id == id);
        if (user) {
          //validate the token
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              callback(200, user);
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

//Users: put
//required fields: email, at least one field to update
handlers.put.updateUser = (data, callback) => {
  //check for the required fields
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 4
      ? data.payload.email.trim()
      : false;

  //check for the optional fields
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length > 0
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  const userType =
    typeof data.payload.userType == "number" ? data.payload.userType : 2;
  const address =
    typeof data.payload.address == "string" &&
    data.payload.address.trim().length > 5
      ? data.payload.address
      : false;

  //check that provided phone number is valid
  if (email) {
    //error if nothing is sent to update
    if (firstName || lastName || phone || password || userType || address) {
      //get the token from the request header
      const token =
        typeof data.headers.token == "string" ? data.headers.token : false;
      //check that user exists for the current email
      _data.listAll("users", (err, data) => {
        if (!err && data) {
          //find the user by email provided
          const user = data.find((user) => user.email == email);
          if (user) {
            //check if token is valid for current user
            controlCard.verifyToken(token, user._id, (tokenIsValid) => {
              if (tokenIsValid) {
                //update the required fields
                if (firstName) {
                  user.firstName = firstName;
                }
                if (lastName) {
                  user.lastName = lastName;
                }
                if (phone) {
                  user.phone = phone;
                }
                if (password) {
                  user.hashedPassword = helpers.hash(password);
                }
                if (userType) {
                  user.userType = userType;
                }
                if (address) {
                  user.address = address;
                }
                const currentDate = new Date();
                user.updatedAt = currentDate.toISOString();

                //update the new fields
                _data.update("users", user._id, user, (err) => {
                  if (!err) {
                    delete user.hashedPassword;
                    callback(200, user);
                  } else {
                    callback(500, {
                      Error: "Could not update new user details",
                    });
                  }
                });
              } else {
                callback(500, { Error: "Token is invalid or expired" });
              }
            });
          } else {
            callback(500, { Error: "User not found by provided email" });
          }
        } else {
          callback(500, { Error: "Could not fetch the list of users" });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update" });
    }
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

//Users -delete
//required fields: Phone
handlers.delete.deleteUser = (data, callback) => {
  //check that phone number is valid
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
    typeof data.headers.token == "string" ? data.headers.token : false;

  if (id && userId && token) {
    //check if requesting user is Admin
    _data.listAll("users", (err, userData) => {
      if (!err && userData) {
        const user = userData.find((user) => user._id == userId);
        if (user && user.userType == 1) {
          //check if token is valid
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              //delete the user
              _data.delete("users", id, (err) => {
                if (!err) {
                  callback(200, { Message: `User ${id} successfully deleted` });
                } else {
                  callback(500, { Error: "Could not delete the user" });
                }
              });
            } else {
              callback(500, { Error: "Invalid or expired token" });
            }
          });
        } else {
          callback(500, {
            Error: "Only Admin user can perform this operation",
          });
        }
      } else {
        callback(500, { Error: "Unable to fetch the list of users" });
      }
    });
  } else {
    callback(400, { Error: "Some required fields are missing" });
  }
};

////define not found handler
handlers.notFound = (data, callback) => {
  callback(404, "Not found");
};

module.exports = handlers;
