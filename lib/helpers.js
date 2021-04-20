/*
 *
 *Helpers for the various tasks
 *
 */
//Dependencies
const _data = require('./data');
const crypto = require("crypto");
const config = require("./config");
const https = require("https");
const queryString = require("querystring");


//create container for the helpers
const helpers = {};

//parse a JSON string to an object in cases without throwing
helpers.parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (error) {
    return {};
  }
};

//create SHA256 hash: function accepts a string and returns hashed version
helpers.hash = (str) => {
  if (typeof str == "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

//create SHA256 hash: function accepts a string and returns hashed version
helpers.createObjectId = (counter) => {
  let str = "";
  const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const randomCharacter = possibleCharacters.charAt(
    Math.floor(Math.random() * 5)
  );
  str += "_" + randomCharacter + counter + Date.now();
  if (typeof str == "string" && str.length > 0) {
    return str;
  } else {
    return false;
  }
};

//create a string of random alphanumeric characters of a given length
helpers.createRandomString = (strLength) => {
  //console.log("started creating");
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    //define all possible characters that could go into a string
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

    //start the final string
    let str = "";
    for (i = 1; i <= strLength; i++) {
      //get random character from the possibleCharacterstring
      const randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      //append this character to the final string
      str += randomCharacter;
    }
    //return the final string
    return str;
  } else {
    return false;
  }
};

/*note: not advisable to perform server size integration for tokenization due to PCI compliance
        client side integration preferred.
        */
helpers.createPaymentToken = (payload, callback) => {
  //validate the parameters
  if (payload) {
    const { number, exp_month, exp_year, cvc } = payload;
    //configure the request details
    const stringPayload = `card[number]=${number}&card[exp_month]=${exp_month}&card[exp_year]=${exp_year}&card[cvc]=${cvc}`;
    //configure request details
    const requestDetails = {
      protocol: "https:",
      hostname: "api.stripe.com",
      method: "post",
      path: "/v1/tokens",
      auth: config.stripe.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload),
      },
    };
    //instantiate the request
    const req = https.request(requestDetails, function (res) {
      res.setEncoding("utf8");
      var body = "";
      res.on("data", function (chunk) {
        body = body + chunk;
        //  console.log(body);
      });
      res.on("end", function () {
        if (res.statusCode != 200) {
          callback(res.statusCode, body);
        } else {
          callback(false, body);
        }
      });
    });
    //bind to an error event so it does not get thrown
    req.on("error", (e) => {
      callback(e);
    });

    //Add the payload
    req.write(stringPayload);

    //end the request
    req.end();
  } else {
    callback("Given parameters are missing on invalid");
  }
};

helpers.createPaymentCharge = (payload, callback) => {
  //validate the parameters
  if (payload) {
    const { number, exp_month, exp_year, cvc } = payload;
    //configure the request details
    const stringPayload = queryString.stringify(payload);
    //configure request details
    const requestDetails = {
      protocol: "https:",
      hostname: "api.stripe.com",
      method: "post",
      path: "/v1/charges",
      auth: config.stripe.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload),
      },
    };
    //instantiate the request
    const req = https.request(requestDetails, function (res) {
      res.setEncoding("utf8");
      var body = "";
      res.on("data", function (chunk) {
        body = body + chunk;
        //  console.log(body);
      });
      res.on("end", function () {
        if (res.statusCode != 200) {
          callback(res.statusCode, body);
        } else {
          callback(false, body);
        }
      });
    });
    //bind to an error event so it does not get thrown
    req.on("error", (e) => {
      callback(e);
    });

    //Add the payload
    req.write(stringPayload);

    //end the request
    req.end();
  } else {
    callback("Given parameters are missing on invalid");
  }
};

helpers.sendMailgunEmail = (emailData, callback) => {
  //destructure the emailData
  const { to, text } = emailData;
  //configure request details
  const payload = {
    from: config.mailGun.from,
    to: to,
    text: text,
  };
  const stringPayload = queryString.stringify(payload);
  const requestDetails = {
    protocol: "https:",
    hostname: "api.mailgun.net",
    method: "post",
    path: "/v3/sandboxd45c61c15c3e4461b68ec729a2c533b1.mailgun.org/messages",
    auth: config.mailGun.basicAuth,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringPayload),
    },
  };
  //instantiate the request
  const req = https.request(requestDetails, function (res) {
    res.setEncoding("utf8");
    var body = "";
  //  console.log(req);
    res.on("data", function (chunk) {
      body = body + chunk;
      console.log(body);
      //  console.log(body);
    });
    res.on("end", function () {
      if (res.statusCode != 200) {
        callback(res.statusCode, body);
      } else {
        callback(false, body);
      }
    });
  });
  //bind to an error event so it does not get thrown
  req.on("error", (e) => {
    callback(e);
  });

  //Add the payload
  req.write(stringPayload);

  //end the request
  req.end();
};

//export the module
module.exports = helpers;
