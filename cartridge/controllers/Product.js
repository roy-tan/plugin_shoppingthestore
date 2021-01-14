
'use strict';

var server = require('server');
var ProductMgr = require('dw/catalog/ProductMgr');
var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');

server.extend(module.superModule);

/**
 * AddToCart
 * Draw Add-To-Cart button recognizing inventory
 */
server.get('AddToCart', function (req, res, next) {
    var productId = req.querystring.productId;
    var addToCartUrl = req.querystring.addToCartUrl;
    var readyToOrder = req.querystring.readyToOrder;

    var apiProduct = ProductMgr.getProduct(productId);
    var availabilityModel = storeHelpers.getStoreAvailabilityModel(apiProduct, storeHelpers.getPreferredStoreId());
    var available = availabilityModel.isInStock();

    var viewData = {
        available: available,
        productId: productId,
        addToCartUrl: addToCartUrl,
        readyToOrder: readyToOrder
    };

    res.render('product/components/addToCartProductButton', viewData);
    next();
});

module.exports = server.exports();
