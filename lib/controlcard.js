const _data = require('./data');

//create controlcard container
const controlCard = {};

controlCard.checkCounter = (callback) => {
  
    _data.read("counters", "id_counter", (err, counterData) => {
      if (!err && counterData) {
        const newCounter = counterData.counter + 1;
        const newCounterData = {
          counter: newCounter,
        };
        //update the counter
        _data.update("counters", "id_counter", newCounterData, (err) => {
          if (!err) {
            callback({ count: newCounter });
          } else {
            callback(false);
          }
        });
      } else {
        callback(false);
      }
    });
  };

//verify if a given token id is currently valid for a given user

controlCard.verifyToken = (token, id, callback) => {
  //lookup the token
  _data.read("tokens", token, (err, tokenData) => {
    if (!err && tokenData) {
      //check that the token is for the given user and has not expired
      if (tokenData.userId == id && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      console.log(err);
      callback(false);
    }
  });
};

//Check if user is admin
controlCard.checkUserType = (email, callback) => {
  _data.read("users", email, (err, userData) => {
    if (!err && userData) {
      if (userData.userType == 1) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

module.exports = controlCard;