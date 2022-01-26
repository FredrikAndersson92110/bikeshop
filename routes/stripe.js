function getPriceData(basket) {
  console.log(basket);
  let priceData = [] 
  // Check basket 
  basket.forEach(item => {
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
      return priceData; 
    });

}

module.exports = getPriceData;

