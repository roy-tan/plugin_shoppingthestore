
'use strict';

var server = require('server');
var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

server.extend(module.superModule);

/**
 * RemoveNotAvailableItems
 * Check for every item if it is available with the new selected store
 */
server.post('RemoveNotAvailableItems', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var Transaction = require('dw/system/Transaction');

    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var notAvailableItems = cartHelper.getNotAvailableItems(storeHelpers.getPreferredStoreId()).productIds;

    var basketModelPlus = {
        notAvailableItems: notAvailableItems
    };

    if (notAvailableItems.length > 0) {
        var bonusProductsUUIDs = [];

        Transaction.wrap(function () {
            for (var i = 0; i < notAvailableItems.length; i += 1) {
                var productId = notAvailableItems[i];

                cartHelper.removeLineItems(productId);
                bonusProductsUUIDs = cartHelper.getBonusProducts(productId, bonusProductsUUIDs);
            }
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var CartModel = require('*/cartridge/models/cart');
        var basketModel = new CartModel(currentBasket);
        basketModelPlus.basket = basketModel;
        basketModelPlus.toBeDeletedUUIDs = bonusProductsUUIDs;
    }
    res.json(basketModelPlus);

    next();
});

/**
 * GetNotAvailableItems
 * Check for every item if it is available with the new selected store.
 * Return list of products that will be not available
 */
server.get('GetNotAvailableItems', function (req, res, next) {
    var storeId = req.querystring.id;
    var notAvailableItems = cartHelper.getNotAvailableItems(storeId);

    var data = {
        notAvailableItems: notAvailableItems
    };

    res.json(data);
    next();
});

module.exports = server.exports();
