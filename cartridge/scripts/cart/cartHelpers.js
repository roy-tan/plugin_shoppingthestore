'use strict';

var assign = require('server/assign');
var Resource = require('dw/web/Resource');

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

/**
 * Sets the store and its inventory list for the given product line item.
 * @param {string} storeId - The store id
 * @param {dw.order.ProductLineItem} productLineItem - The ProductLineItem object
 */
function setStoreInProductLineItem(storeId, productLineItem) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var Transaction = require('dw/system/Transaction');

    Transaction.wrap(function() {
        if (storeId) {
            var store = StoreMgr.getStore(storeId);
            if (store) {
                var inventoryListId = store.inventoryListID;
                if (inventoryListId) {
                    var storeinventory = ProductInventoryMgr.getInventoryList(inventoryListId);
                    if (storeinventory) {
                        if (storeinventory.getRecord(productLineItem.productID) &&
                            storeinventory.getRecord(productLineItem.productID).ATS.value >=
                            productLineItem.quantityValue) {
                            productLineItem.custom.fromStoreId = store.ID;
                            productLineItem.setProductInventoryList(storeinventory);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 *  @return {Object} returns an error object
 */
base.addProductToCart = function(currentBasket, productId, quantity, childProducts, options) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var Transaction = require('dw/system/Transaction');

    var availableToSell;
    var defaultShipment = currentBasket.defaultShipment;
    var perpetual;
    var product = ProductMgr.getProduct(productId);
    var productInCart;
    var productLineItems = currentBasket.productLineItems;
    var productQuantityInCart;
    var quantityToSet;
    var optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);
    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };

    var totalQtyRequested = 0;
    var canBeAdded = false;

    if (product.bundle) {
        canBeAdded = base.checkBundledProductCanBeAdded(childProducts, productLineItems, quantity);
    } else {
        totalQtyRequested = quantity + base.getQtyAlreadyInCart(productId, productLineItems);
        perpetual = product.availabilityModel.inventoryRecord.perpetual;
        canBeAdded =
            (perpetual ||
                totalQtyRequested <= product.availabilityModel.inventoryRecord.ATS.value);
    }

    Transaction.wrap(function() {
        if (currentBasket.custom.allowReplacement == null) {
            currentBasket.custom.allowReplacement = true;
        }
    });

    if (!canBeAdded) {
        result.error = true;
        result.message = Resource.msgf(
            'error.alert.selected.quantity.cannot.be.added.for',
            'product',
            null,
            product.availabilityModel.inventoryRecord.ATS.value,
            product.name
        );
        return result;
    }

    productInCart = base.getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options);

    if (productInCart) {
        productQuantityInCart = productInCart.quantity.value;
        quantityToSet = quantity ? quantity + productQuantityInCart : productQuantityInCart + 1;
        availableToSell = productInCart.product.availabilityModel.inventoryRecord.ATS.value;

        if (availableToSell >= quantityToSet || perpetual) {
            productInCart.setQuantityValue(quantityToSet);
            result.uuid = productInCart.UUID;
        } else {
            result.error = true;
            result.message = availableToSell === productQuantityInCart ?
                Resource.msg('error.alert.max.quantity.in.cart', 'product', null) :
                Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null);
        }
    } else {
        var productLineItem;
        productLineItem = base.addLineItem(
            currentBasket,
            product,
            quantity,
            childProducts,
            optionModel,
            defaultShipment
        );

        // By default set allow replacement to true;
        if (currentBasket.custom.allowReplacement) {
            productLineItem.custom.allowReplacement = true;
        }

        // eslint-disable-next-line no-undef
        var preferredStoreId = session.custom.preferredStoreId;
        if (preferredStoreId != null) {
            setStoreInProductLineItem(preferredStoreId, productLineItem);
        }

        result.uuid = productLineItem.UUID;
    }

    return result;
};

module.exports = assign({}, base, {
    removeLineItems: removeLineItems,
    getBonusProducts: getBonusProducts,
    getNotAvailableItems: getNotAvailableItems,
    addProductToCart: base.addProductToCart
});