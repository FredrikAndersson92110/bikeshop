const mongoose = require("mongoose"); 

let productSchema = mongoose.Schema({
  name: String, 
  url: String,
  price: Number, 
  stock: Number,
}); 

module.exports = mongoose.model("products", productSchema);