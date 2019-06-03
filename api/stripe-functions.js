/* Server Side -- Stripe API calls */
require('dotenv').config();
var stripe = require('stripe')(process.env.SECRET_API_KEY);
var UTILS = require('../utils/format-numbers.js');

function getAllProductsAndPlans() {
  return Promise.all(
    [
      stripe.products.list({}),
      stripe.plans.list({})
    ]
  ).then(stripeData => {
    let products = stripeData[0].data;
    let plans = stripeData[1].data;

    plans = plans.sort((a, b) => {

      console.log(`a.amount - b.amount ${a.amount - b.amount}`);
      return a.amount - b.amount;
    }).map(plan => {

      console.log(`UTILS.formatUSD(plan.amount) ${UTILS.formatUSD(plan.amount)}`);
      amount = UTILS.formatUSD(plan.amount)
      console.log('***');
      console.log(plan);
      console.log(amount);
      return {...plan, amount};
    });

    products.forEach(product => {
      const filteredPlans = plans.filter(plan => {
        return plan.product === product.id;
      });

      product.plans = filteredPlans;
    });

    return products;
  });
}


function createProduct(requestBody) {
  return stripe.products.create({
    name: requestBody.productName,
    type: 'service'
  });
}


function createPlan(requestBody) {

  console.log(`requestBody.planPrice ${requestBody.planPrice}`);
  console.log(`requestBody.planIntervalNumber ${requestBody.planIntervalNumber}`);
  console.log(requestBody);

  return stripe.plans.create({
    nickname: requestBody.planName,
    amount: UTILS.formatStripeAmount(requestBody.planPrice),
    interval: requestBody.planInterval,
    interval_count: parseInt(requestBody.planIntervalNumber),
    product: requestBody.productId,
    currency: 'USD'
  });
}


function createCustomerAndSubscription(requestBody) {
  console.log('createCustomerAndSubscription');
  return stripe.customers.create({
    source: requestBody.stripeToken,
    email: requestBody.customerEmail
  }).then(customer => {
    console.log(`customer ${customer.id}`);
    console.log(`requestBody.planId ${requestBody.planId}`);
    stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          plan: requestBody.planId
        }
      ]
    });
  });
}


module.exports = {
  getAllProductsAndPlans,
  createProduct,
  createPlan,
  createCustomerAndSubscription
};
