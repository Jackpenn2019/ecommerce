const _data = require("../data");
const helpers = require("../helpers");
const config = require("../config");
const controlCard = require("../controlcard");

const handlers = {};

handlers.post = {};

handlers.post.createToken = (data, callback) => {
  const number =
    typeof data.payload.number == "number" ? data.payload.number : false;

  const exp_month =
    typeof data.payload.exp_month == "number" ? data.payload.exp_month : false;

  const exp_year =
    typeof data.payload.exp_year == "number" ? data.payload.exp_year : false;

  const cvc = typeof data.payload.cvc == "number" ? data.payload.cvc : false;

  const userId =
    typeof data.payload.userId == "string" && data.payload.userId.trim().length > 4
      ? data.payload.userId.trim()
      : false;

  const token =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 20
      ? data.headers.token.trim()
      : false;

  if (userId && token && number && exp_month && exp_year && cvc) {
    _data.listAll("users", (err, data) => {
      if (!err && data) {
        const user = data.find((user) => user._id == userId);
        if (user) {
          //validate the token
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              const payload = {
                number: number,
                exp_month: exp_month,
                exp_year: exp_year,
                cvc: cvc,
              };

              helpers.createPaymentToken(payload, (err, data) => {
                if (!err && data) {
                  callback(200, JSON.parse(data));
                } else {
                  callback(500, data);
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

handlers.post.createDebit = (data, callback) => {
  const amount =
    typeof data.payload.amount == "number" ? data.payload.amount : false;

  const currency =
    typeof data.payload.currency == "string" ? data.payload.currency : false;

  const source =
    typeof data.payload.source == "string" ? data.payload.source : false;

  const description = typeof data.payload.description == "string" ? data.payload.description : false;

  const userId =
    typeof data.payload.userId == "string" && data.payload.userId.trim().length > 4
      ? data.payload.userId.trim()
      : false;

  const token =
    typeof data.headers.token == "string" &&
    data.headers.token.trim().length == 20
      ? data.headers.token.trim()
      : false;

  if (userId && token && amount && currency && source) {
    _data.listAll("users", (err, data) => {
      if (!err && data) {
        const user = data.find((user) => user._id == userId);
        if (user) {
          //validate the token
          controlCard.verifyToken(token, user._id, (tokenIsValid) => {
            if (tokenIsValid) {
              const payload = {
                amount: amount,
                currency: currency,
                source: source,
                description: description,
              };
              helpers.createPaymentCharge(payload, (err, data) => {
                if (!err && data) {
                  callback(200, JSON.parse(data));
                } else {
                  callback(500, data);
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


module.exports = handlers;
