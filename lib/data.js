/*
 *
 * Library for storing and editing data
 *
 */
//Dependencies
const fs = require("fs");
const helpers = require("./helpers");
const path = require("path");
const url = require("url");

//initialize the data container
const lib = {};

//define the base directory of the data folder
lib.baseDir = path.join(__dirname, "/../.data/");
//generic method to write data to a file
lib.create = (dir, file, data, callback) => {
  console.log(lib.baseDir);
  //try to open the file for writing
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "wx",
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        //convert data to string in order to write to file
        const stringData = JSON.stringify(data);
        //write the data to file
        fs.writeFile(fileDescriptor, stringData, (err) => {
          if (!err) {
            //close the file after writing
            fs.close(fileDescriptor, (err) => {
              if (!err) {
                callback(false);
              } else {
                callback("Error: Could not close the file after writing data");
              }
            });
          } else {
            callback("Error: Could not write data to file");
          }
        });
      } else {
        callback("Error: Could not create new file");
      }
    }
  );
};

//read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(
    lib.baseDir + dir + "/" + file + ".json",
    "utf-8",
    (err, data) => {
      if (!err && data) {
        //convert the read data to JSON
        const parsedData = helpers.parseJsonToObject(data);
        callback(false, parsedData);
      } else {
        console.log(err);
        callback("Error: Could not read the file");
      }
    }
  );
};

//update data in a file
lib.update = (dir, file, data, callback) => {
  //open the file for writing
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "r+",
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        //convert the data to a string
        const stringData = JSON.stringify(data);
        //Truncate existing data
        fs.truncate(fileDescriptor, (err) => {
          if (!err) {
            //write the new data to the file
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                //close the file
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback("Error: Could not close the file");
                  }
                });
              } else {
                callback("Error: Could not write new data to the file");
              }
            });
          } else {
            callback("Error: Could not truncate the data");
          }
        });
      } else {
        callback("Error: Could not open the file");
      }
    }
  );
};

//function to delete a file
lib.delete = (dir, file, callback) => {
  //unlink, remove file from file system
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", (err) => {
    if (!err) {
      callback(false);
    } else {
      callback("Error: Could not unlink file");
    }
  });
};

//read the contents of a directory
lib.list = (dir, callback) => {
  fs.readdir(lib.baseDir + dir + "/", (err, data) => {
    if (!err && data && data.length > 0) {
      const trimmedFileNames = [];
      data.forEach((fileName) => {
        trimmedFileNames.push(fileName.replace(".json", ""));
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

//read the contents of a directory
lib.listAll = (dir, callback) => {
  fs.readdir(lib.baseDir + dir + "/", (err, data) => {
    if (!err && data && data.length > 0) {
      const trimmedFileNames = [];
      data.forEach((fileName) => {
        trimmedFileNames.push(fileName.replace(".json", ""));
      });
      const dataArray = [];
      for (i = 0; i < trimmedFileNames.length; i++) {
        const data = fs.readFileSync(lib.baseDir + dir + "/" + trimmedFileNames[i] + ".json","utf-8");
        dataArray[i] = helpers.parseJsonToObject(data);
      }
      callback(false, dataArray);
    } else {
      callback(err, data);
    }
  });
};

//export the module
module.exports = lib;
