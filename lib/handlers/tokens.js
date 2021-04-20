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
//define handlers
const handlers = {};

//define the container for the token sub methods
handlers.post = {};
handlers.get = {};
handlers.put = {};
handlers.delete = {};

//token post handler
//required data: email, password

handlers.post.createToken = (data, callback) => {
  //check for mandatory fields
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 4
      ? data.payload.email
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  if (email && password) {
    //check that email belongs to an existing user
    _data.listAll("users", (err, userData) => {
      if (!err && userData) {
        const user = userData.find((user) => user.email == email);
        if (user) {
          //hash the password sent by user and compare with stored password
          const hashedPassword = helpers.hash(password);
          if (hashedPassword == user.hashedPassword) {
            //create the token id and store it under the user object
            const tokenId = helpers.createRandomString(20);
            const expires = Date.now() + 1000 * 60 * 60;

            //create the token object
            const tokenObject = {
              email: email,
              id: tokenId,
              expires: expires,
              userId:user._id
            };

            //save the token
            _data.create("tokens", tokenId, tokenObject, (err) => {
              if (!err) {
                delete user.hashedPassword;
                callback(200, { token: tokenId, user: user });
              } else {
                console.log(err);
                callback(500, { Error: "Could not successfully login" });
              }
            });
          } else {
            callback(500, { Error: "Incorrect password provided" });
          }
        } else {
          callback(500, { Error: "Could not find user by email provided" });
        }
      } else {
        callback(500, { Error: "Could not fetch list of users" });
      }
    });
  } else {
    callback(403, { Error: "Some required data is missing" });
  }
};

//get handler for tokens
//required data: token

handlers.get.findToken = (data, callback) => {
  //check for required data
  const token =
    typeof data.queryStringObject.token == "string" &&
    data.queryStringObject.token.trim().length == 20
      ? data.queryStringObject.token.trim()
      : false;

  if (token) {
    //check if token id is existing
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(500, { Error: "Invalid token provided" });
      }
    });
  } else {
    callback(403, { Error: "Some required fields are missing" });
  }
};

//tokens: PUT handler
//required data: token
handlers.put.updateToken = (data, callback) => {
  //check for mandatory fields
  const token =
    typeof data.payload.token == "string" &&
    data.payload.token.trim().length == 20
      ? data.payload.token.trim()
      : false;
  const extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;

  if (token && extend) {
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        //check that token is not already expired
        if (tokenData.expires > Date.now()) {
          //update the expiry data
          tokenData.expires = Date.now() + 1000 * 60 * 60 * 60;
          _data.update("tokens", token, tokenData, (err) => {
            if (!err) {
              callback(200, tokenData);
            } else {
              callback(500, { Error: "Could not update token data" });
            }
          });
        } else {
          callback(400, { Error: "Token already expired" });
        }
      } else {
        callback(404, { Error: "Invalid token received" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields or fields are invalid" });
  }
};

//Token delete handler
//Method: delete (deleting a token is basically like logging out)
//Required fields: id
//Optional fields: none
handlers.delete.deleteToken = (data, callback) => {
  //check for mandatory fields
  const token =
    typeof data.queryStringObject.token == "string" &&
    data.queryStringObject.token.trim().length == 20
      ? data.queryStringObject.token.trim()
      : false;
  if (token) {
    //check that the token is valid
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        _data.delete("tokens", token, (err) => {
          if (!err) {
            callback(200, { Message: "Token successfully destroyed" });
          } else {
            callback(500, { Error: "Could not delete the user token" });
          }
        });
      } else {
        callback(404, { Error: "Invalid token provided" });
      }
    });
  } else {
    callback(400, { Error: "Missing mandatory fields" });
  }
};

handlers.notFound = (data, callback) => {
  callback(404, "Not found");
};

module.exports = handlers;
