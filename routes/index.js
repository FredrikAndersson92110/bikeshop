const express = require('express');
const dotenv = require("dotenv"); 
var router = express.Router();
const calculateTotal = require("./amount");
const dataBike = require("./dataBike");
dotenv.config(); 
//SETUP STRIPE SETTINGS
const stripe = require('stripe')(process.env.SECRET_KEY);

// Initialize session
function sessionInit(req) {
  if(req.session.dataCardBike == undefined) {
    req.session.dataCardBike = [];
  }
}

//Stripe Checkout Route
router.post('/create-checkout-session/:shippingFees', async (req, res) => {
  let priceData = [] 
  // Check basket 
  req.session.dataCardBike.forEach(item => {
    let newProduct =
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
          },
          unit_amount: Number(item.price) * 100,
        },
        quantity: Number(item.quantity),
      }
      priceData.push(newProduct)
    });

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
 // end stripe

/* GET home page. */
router.get('/', function(req, res, next) {
  sessionInit(req);
    res.render('index', { dataBike:dataBike, panier: req.session.dataCardBike });
});


// GET SHOP 
router.get('/shop', (req, res) => {
  sessionInit(req);
  let amount = calculateTotal(req.session.dataCardBike);

  res.render('shop', {
    dataBike, 
    dataCardBike: req.session.dataCardBike, 
    amount, 
  });
});

// Add shop 
router.get("/add-shop", (req, res) => {
  sessionInit(req); 

  let alreadyExist = false; 
  req.session.dataCardBike.forEach(bike => {
    if (bike.name == req.query.bikeNameFromFront) {
      bike.quantity = Number(bike.quantity) + 1; 
      let index = dataBike.findIndex(bike => bike.name === req.query.bikeNameFromFront);
      dataBike[index].stock -= 1; 
      console.log(dataBike[index].stock);
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
    let index = dataBike.findIndex(bike => bike.name === req.query.bikeNameFromFront);
    dataBike[index].stock -= 1; 
    console.log(dataBike[index].stock);
  }

  res.redirect("/shop");
});

// Update quantity
router.post('/update-shop', function(req, res, next){
  sessionInit(req);

  let index = dataBike.findIndex(bike => bike.name === req.body.name);
  dataBike[index].stock -= 1; 

  var position = req.body.position;
  var newQuantity = req.body.quantity;
  req.session.dataCardBike[position].quantity = newQuantity;
  res.redirect('/shop');
});


// Delete bike
router.get('/delete-shop/:position', function(req, res, next){
  sessionInit(req);
  req.session.dataCardBike.splice(req.params.position, 1);
  res.redirect("/shop");
});


// STRIPE PAYMENT ROUTES
router.get("/success", (req, res) => {
  res.render("success"); 
});

router.get("/cancel", (req, res) => {
  res.render("cancel"); 
});

// Select delivery
router.get("/shop/delivery/:selDelivery", (req, res) => {
  sessionInit(req);

  console.log(req.params.selDelivery);

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

module.exports = router;
