const express = require('express');
const dotenv = require("dotenv"); 
var router = express.Router();

dotenv.config(); 

//SETUP STRIPE SETTINGS
const stripe = require('stripe')(process.env.SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
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

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: priceData,
    mode: 'payment',
    success_url: 'http://localhost:3000/success',
    cancel_url: 'http://localhost:3000/cancel',
  });
 
  res.redirect(303, session.url);
 });
 // end stripe
 
var dataBike = [
  {name:"BIK045", url:"/images/bike-1.jpg", price:679},
  {name:"ZOOK07", url:"/images/bike-2.jpg", price:999},
  {name:"TITANS", url:"/images/bike-3.jpg", price:799},
  {name:"CEWO", url:"/images/bike-4.jpg", price:1300},
  {name:"AMIG039", url:"/images/bike-5.jpg", price:479},
  {name:"LIK099", url:"/images/bike-6.jpg", price:869},
]

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.dataCardBike == undefined) {
    req.session.dataCardBike = [];
  }
  res.render('index', { dataBike:dataBike });
});

// GET SHOP 
router.get('/shop', function(req, res, next) {
  if(req.session.dataCardBike == undefined) {
    req.session.dataCardBike = [];
  }
  let requestedBike = req.query.bikeNameFromFront;

  let index = req.session.dataCardBike.findIndex( bike => bike.name === requestedBike);
  if(index > -1) {
    let newBike = {
      name: req.query.bikeNameFromFront,
      url: req.query.bikeImageFromFront,
      price: req.query.bikePriceFromFront,
      quantity: Number(req.session.dataCardBike[index].quantity) + 1
    }
    req.session.dataCardBike.splice(index, 1, newBike);

  } else if (index == -1 && req.query.bikeNameFromFront !== undefined) {
          req.session.dataCardBike.push({
        name: req.query.bikeNameFromFront,
        url: req.query.bikeImageFromFront,
        price: req.query.bikePriceFromFront,
        quantity: 1
      });
  }
  res.render('shop', {dataCardBike: req.session.dataCardBike });
});

// Delete bike
router.get('/delete-shop', function(req, res, next){
  req.session.dataCardBike.splice(req.query.position,1);
  res.render('shop',{dataCardBike: req.session.dataCardBike });
});

// Update quantity
router.post('/update-shop', function(req, res, next){
  var position = req.body.position;
  var newQuantity = req.body.quantity;
  req.session.dataCardBike[position].quantity = newQuantity;
  res.render('shop',{dataCardBike:req.session.dataCardBike})
});

// STRIPE PAYMENT ROUTES
router.get("/success", (req, res) => {
  res.render("success"); 
});

router.get("/cancel", (req, res) => {
  res.render("cancel"); 
});

module.exports = router;
