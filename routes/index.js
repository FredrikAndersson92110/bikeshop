const express = require('express');
const dotenv = require("dotenv"); 
var router = express.Router();
const ProductModel = require("../models/products")
const calculateTotal = require("./amount");
const dataBike = require("./dataBike");
const getPriceData = require("./stripe"); 
dotenv.config(); 
//SETUP STRIPE SETTINGS
const stripe = require('stripe')(process.env.SECRET_KEY);

// FUNCTIONS 
//Init session
function sessionInit(req) {
  if(req.session.dataCardBike == undefined) {
    req.session.dataCardBike = [];
  }
}

//checkstock
function updateStock(request) {
  let index = dataBike.findIndex(bike => bike.name === request);
  dataBike[index].stock -= 1;    
}

//Stripe Checkout Route
router.post('/create-checkout-session/:shippingFees', async (req, res) => {
  console.log(req.session.dataCardBike);
  let priceData = []
  priceData = getPriceData(req.session.dataCardBike); 
  console.log(priceData);
    // Send Shipping Fees 
    let shippingOptions = [];
    let amount = Number(req.params.shippingFees);
    let shippingMessage = amount === 0 ? "Frais offerts" : "Standard shipping";

    shippingOptions.push(
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: amount * 100,
            currency: 'eur',
          },
          display_name: shippingMessage,
        }
      }
    )

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    shipping_options: shippingOptions,
    line_items: priceData,
    mode: 'payment',
    success_url: 'https://thebestbikeshop.herokuapp.com/success',
    cancel_url: 'https://thebestbikeshop.herokuapp.com/cancel',
  });
 
  res.redirect(303, session.url);
 });

 // Confirmation pages 
router.get("/success", (req, res) => {
  res.render("success"); 
});

router.get("/cancel", (req, res) => {
  res.render("cancel"); 
});

 // --------- end stripe ----------------



// ------------- HOME -----------------
router.get('/', async function(req, res, next) {
  sessionInit(req);
  let products = await ProductModel.find(); 
    res.render('index', { dataBike:products, panier: req.session.dataCardBike });
});

// --------------- SHOP ------------- 
router.get('/shop', (req, res) => {
  sessionInit(req);
  let amount = calculateTotal(req.session.dataCardBike);

  res.render('shop', {
    dataBike, 
    dataCardBike: req.session.dataCardBike, 
    amount, 
  });
});

// -------------ADD BIKE-------------------
router.get("/add-shop", (req, res) => {
  sessionInit(req); 

  let alreadyExist = false; 
  req.session.dataCardBike.forEach(bike => {
    if (bike.name == req.query.bikeNameFromFront) {
      bike.quantity = Number(bike.quantity) + 1; 
      updateStock(req.query.bikeNameFromFront); 
      alreadyExist = true;
    }
  });
  
  if(alreadyExist == false) {
    req.session.dataCardBike.push({
      name: req.query.bikeNameFromFront,
      url: req.query.bikeImageFromFront,
      price: req.query.bikePriceFromFront,
      quantity: 1
    });
    updateStock(req.query.bikeNameFromFront); 
  }
  res.redirect("/shop");
});

// ------------UPDATE QUANTITY-------------- 
router.post('/update-shop', function(req, res, next){
  sessionInit(req);
  updateStock(req.body.name);

  var position = req.body.position;
  var newQuantity = req.body.quantity;
  req.session.dataCardBike[position].quantity = newQuantity;
  res.redirect('/shop');
});


// ----------- DELETE -------------
router.get('/delete-shop/:position', function(req, res, next){
  sessionInit(req);
  req.session.dataCardBike.splice(req.params.position, 1);
  res.redirect("/shop");
});

// --------------- DELIVERY ---------------
router.get("/shop/delivery/:selDelivery", (req, res) => {
  sessionInit(req);

  if(req.params.selDelivery === "standard") {
    deliveryFees = 0;
  }
  if(req.params.selDelivery === "express") {
    deliveryFees = 0;
    deliveryFees += 100;
  }
  if(req.params.selDelivery === "relais") {
      deliveryFees = 0;
      let quantity = 0;
      for(let i = 0; i < req.session.dataCardBike.length; i++) {
        quantity += Number(req.session.dataCardBike.quantity);
      }
      if(quantity === 1) {
        deliveryFees += 50;   
      } else {
        deliveryFees += 20; 
      }
  }
  res.redirect("/shop");
});

router.get("/create-bike", (req, res) => {
    res.render("create-bike");
});

router.post("/create-bike", async (req, res) => {
  let newBikeStock = new ProductModel({
    name: req.body.model,
    url: req.body.imgURL, 
    price: req.body.price,
    stock: req.body.stock
  });
  let savedBikeStock = await newBikeStock.save();

  res.redirect("/");
});

module.exports = router;
