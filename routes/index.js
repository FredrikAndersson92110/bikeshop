const express = require('express');
const dotenv = require("dotenv"); 
var router = express.Router();

dotenv.config(); 

//SETUP STRIPE SETTINGS
const stripe = require('stripe')(process.env.SECRET_KEY);

var dataBike = [
  {mea: true, name:"BIK045", url:"/images/ruff.jpg", price:679},
  {mea: false, name:"ZOOK07", url:"/images/velo-electrique.jpg", price:999},
  {mea: true, name:"TITANS", url:"/images/velobecan.jpg", price:799},
  {mea: false, name:"CEWO", url:"/images/fixie.jpg", price:1300},
  {mea: true, name:"AMIG039", url:"/images/peugeot.jpg", price:479},
  {mea: false, name:"LIK099", url:"/images/brompton.jpg", price:869},
]

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

  let totalCmd = 0; 
  let shippingFees = 0;
  let message;  

  for (let i in req.session.dataCardBike) {
    let subTotal = req.session.dataCardBike[i].quantity * req.session.dataCardBike[i].price;
      totalCmd += subTotal; 
      shippingFees += Number(req.session.dataCardBike[i].quantity) * 30; 
  }

  if(totalCmd >= 4000) {
    shippingFees = 0;
    message = "Frais de port offerts";
  } else if (totalCmd >= 2000) {
    shippingFees = shippingFees / 2;
    message = "Frais moins 50%"
  }

  res.render('shop', {
    dataCardBike: req.session.dataCardBike, 
    shippingFees, 
    totalCmd,
    message 
  });
});

// Add shop 
router.get("/add-shop", (req, res) => {
  sessionInit(req); 

  let alreadyExist = false; 
  req.session.dataCardBike.forEach(bike => {
    if (bike.name == req.query.bikeNameFromFront) {
      bike.quantity = Number(bike.quantity + 1); 
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
  }

  res.redirect("/shop");
});

// Update quantity
router.post('/update-shop', function(req, res, next){
  sessionInit(req);

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

module.exports = router;
