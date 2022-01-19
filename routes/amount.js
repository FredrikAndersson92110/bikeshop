
function calculateTotal(basket) {
  let totalCmd = 0; 
  let shippingFees = 0;
  let message;

  for (let i in basket) {
    let subTotal = basket[i].quantity * basket[i].price;
      totalCmd += subTotal; 
      shippingFees += (Number(basket[i].quantity) * 30); 
  }

  if(totalCmd >= 4000) {
    shippingFees = 0; 
    message = "Frais de port offerts"
  } else if(totalCmd >= 2000) {
    shippingFees = shippingFees/2 
    message = "Réduction de 50%"
  }

  return {
    totalCmd,
    shippingFees,
    message
  };
}

module.exports = calculateTotal
