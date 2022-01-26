const dotenv = require("dotenv"); 
const mongoose = require("mongoose"); 

dotenv.config();

mongoose.connect("mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_SECRET + "@cluster0.2ozuf.mongodb.net/bikeshop?retryWrites=true&w=majority",
function(err) {
  if(err) {
    console.log(err);
  } else {
    console.log("Connected!");
  }
}
);


