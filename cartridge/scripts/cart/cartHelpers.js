'use strict';

var assign = require('server/assign');

var base = module.superModule;

/**
 * getBonusProducts
 * @param {*} productId - product the bonus product is for
 * @param {*} bonusProductsUUIDs - array the bonus products are to be added to
 * @returns {[]} bonusProductsUUIDs with added items
 */
function getBonusProducts(productId, bonusProductsUUIDs) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    var bonusProductLineItems = currentBasket.bonusLineItems;
    var mainProdItem;
    if (bonusProductLineItems && bonusProductLineItems.length > 0) {
        for (var i = 0; i < bonusProductLineItems.length; i += 1) {
            var bonusItem = bonusProductLineItems[i];
            mainProdItem = bonusItem.getQualifyingProductLineItemForBonusProduct();
            if (mainProdItem !== null && (mainProdItem.productID === productId)) {
                bonusProductsUUIDs.push(bonusItem.UUID);
            }
        }
    }
    return bonusProductsUUIDs;
}

/**
 * removeLineItems
 * @param {*} productId - product id that is to be removed
 */
function removeLineItems(productId) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    var productLineItems = currentBasket.getAllProductLineItems(productId);
    for (var i = 0; i < productLineItems.length; i += 1) {
        var item = productLineItems[i];

        var shipmentToRemove = item.shipment;
        currentBasket.removeProductLineItem(item);
        if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
            currentBasket.removeShipment(shipmentToRemove);
        }
    }
}

/**
 * getNotAvailableItems
 * @param {*} storeId store the availability should be checked for
 * @return {[]} array of not available products
 */
function getNotAvailableItems(storeId) {
    var result = {
        productIds: [],
        quantity: 0
    };

    var BasketMgr = require('dw/order/BasketMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket) {
        var allProductLineItems = currentBasket.getAllProductLineItems();
        for (var i = 0; i < allProductLineItems.length; i += 1) {
            var productId = allProductLineItems[i].productID;
            var apiProduct = ProductMgr.getProduct(productId);
            var availabilityModel = storeHelpers.getStoreAvailabilityModel(apiProduct, storeId);
            var available = availabilityModel.isInStock();

            if (!available) {
                result.productIds.push(productId);
                result.quantity += allProductLineItems[i].quantity;
            }
        }
    }
    return result;
}

module.exports = assign({}, base, {
    removeLineItems: removeLineItems,
    getBonusProducts: getBonusProducts,
    getNotAvailableItems: getNotAvailableItems
});
