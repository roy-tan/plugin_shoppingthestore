
'use strict';

var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');

/**
 * Gets the maximum allowed cart quantity for a product.
 * @param {Product|string} product - product object
 * @return {number} - max qty allowed for the product
 */
function getProductMaxQuantity(product) {
    var Site = require('dw/system/Site');
    var siteMax = Site.getCurrent().getCustomPreferenceValue('quantityMaxValue') || 5;
    var productMax = null;
    var productObj = product;

    if (typeof product === 'string') {
        productObj = require('dw/catalog/ProductMgr').getProduct(product);
    }

    if ('maxOrderQuantity' in productObj.custom) {
        productMax = productObj.custom.maxOrderQuantity || 5;
    }

    if (empty(productMax) || productMax === 0) {
        return siteMax;
    }

    return Math.min(siteMax, productMax);
}

/**
 * Copy custom fields from one object to another
 * NOTE: Should be wrapped with Transaction!!!
 *
 * @param  {Object} from copied from obj
 * @param  {Object} to copied to obj
 */
function copyCustomAttributes(from, to) {
    if ('custom' in from && 'custom' in to) {
        var keys = Object.keys(from.custom);
        keys.forEach(function (key) {
            if (Object.prototype.hasOwnProperty.call(from.custom, key)) {
                to.custom[key] = from.custom[key];
            }
        });
    }
}

/**
 * Remove all product line items from {lineItemCtnr} object
 *
 * @param  {dw.order.LineItemCtnr} lineItemCtnr Basket or Order object
 */
function clearProductLineItems(lineItemCtnr) {
    if (lineItemCtnr != null) {
        var plis = lineItemCtnr.getAllProductLineItems();

        Transaction.wrap(function () {
            for (var i = 0; i < plis.length; i += 1) {
                var pli = plis[i];

                lineItemCtnr.removeProductLineItem(pli);
            }
        });
    }
}

/**
 * Remove shipping/billing address and set shipping method for {lineItemCtnr} object
 *
 * @param  {dw.order.LineItemCtnr} lineItemCtnr Basket or Order object
 */
function clearShippingAndBilling(lineItemCtnr) {
    Transaction.wrap(function () {
        lineItemCtnr.defaultShipment.createShippingAddress();
        lineItemCtnr.defaultShipment.setShippingMethod(null);
        lineItemCtnr.createBillingAddress();
    });
}

/**
 * Sets the shipping address to the default address for {lineItemCtnr} object
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr Basket or Order object
 */
function applyDefaultShippingAddress(lineItemCtnr) {
    if (customer.addressBook !== null && customer.addressBook.preferredAddress !== null) {
        Logger.error('Add default shipping' + lineItemCtnr);
    }
}

/**
 * Remove payment instruments for {lineItemCtnr} object
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr Basket or Order object
 */
function clearPaymentInstruments(lineItemCtnr) {
    var iter = lineItemCtnr.getPaymentInstruments().iterator();
    Transaction.wrap(function () {
        while (iter.hasNext()) {
            var pi = iter.next();

            lineItemCtnr.removePaymentInstrument(pi);
        }
    });
}

/**
 * Remove coupon items for {lineItemCtnr} object
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr Basket or Order object
 */
function clearCouponLineItems(lineItemCtnr) {
    var iter = lineItemCtnr.getCouponLineItems().iterator();
    Transaction.wrap(function () {
        while (iter.hasNext()) {
            var couponLineItem = iter.next();

            lineItemCtnr.removeCouponLineItem(couponLineItem);
        }
    });
}

/**
 * Create product line item that assigned to BonusDiscountLineItem
 *
 * @param {dw.order.BonusDiscountLineItem} copyFrom BonusDiscountLineItem FROM what PLI's will be copied
 * @param {dw.order.BonusDiscountLineItem} copyTo BonusDiscountLineItem TO what PLI's will be copied
 * @param {dw.order.LineItemCtnr} objectToSave Basket or Order object that will be updated with BonusDiscountLineItem
 */
function loadBonusProductLineItems(copyFrom, copyTo, objectToSave) {
    var bonusPLIs = copyFrom.getBonusProductLineItems();

    Transaction.wrap(function () {
        for (var i = 0; i < bonusPLIs.length; i += 1) {
            var productLineItem = bonusPLIs[i];
            objectToSave.createBonusProductLineItem(copyTo, productLineItem.product, null, null);
        }
    });
}

/**
 * Copy bonus discount product line items
 *
 * @param {dw.order.LineItemCtnr} copyFrom Basket or Order object
 * @param {dw.order.LineItemCtnr} copyTo Basket or Order object
 */
function loadBonusDiscountLineItems(copyFrom, copyTo) {
    var bonusDiscountItems = copyFrom.getBonusDiscountLineItems();

    for (var i = 0; i < bonusDiscountItems.length; i += 1) {
        var promoIdThatUsed = bonusDiscountItems[i].getPromotionID();
        // looking if the same {promoIdThatUsed} assigned to another LineItemCtnr
        for (var j = 0; j < copyTo.getBonusDiscountLineItems().length; j += 1) {
            var copiedPromoId = copyTo.getBonusDiscountLineItems()[j].getPromotionID();
            if (promoIdThatUsed === copiedPromoId) {
                loadBonusProductLineItems(bonusDiscountItems[i], copyTo.getBonusDiscountLineItems()[j], copyTo);
            }
        }
    }
}

/**
 * Copy Coupon Line items from one object to another
 *
 * @param  {dw.order.LineItemCtnr|Object} copyFrom Basket or Order object
 * @param  {dw.order.LineItemCtnr} copyTo Basket or Order object
 */
function loadCoupons(copyFrom, copyTo) {
    Transaction.wrap(function () {
        if (copyFrom.couponLineItems.length > 0) {
            for (var i = 0; i < copyFrom.couponLineItems.length; i += 1) {
                try {
                    var couponLineItem = copyFrom.couponLineItems[i];
                    copyTo.createCouponLineItem(couponLineItem.couponCode, true);
                } catch (e) {
                    Logger.error('Coupon line item can not be added');
                }
            }
        }
    });
}

/**
 * Copy Shipping Method
 *
 * @param  {dw.order.LineItemCtnr} copyFrom Basket or Order object
 * @param  {dw.order.LineItemCtnr} copyTo Basket or Order object
 */
function loadShippingMethod(copyFrom, copyTo) {
    var basket = copyTo;
    var shipment = copyFrom.getDefaultShipment() != null ? copyFrom.getDefaultShipment() : null;
    if (shipment != null && shipment.getShippingMethod() != null) {
        Transaction.wrap(function () {
            basket.getDefaultShipment().setShippingMethod(shipment.getShippingMethod());
        });
    }
}

/**
 * Copy Shipping Address
 *
 * @param  {dw.order.LineItemCtnr} copyFrom Basket or Order object
 * @param  {dw.order.LineItemCtnr} copyTo Basket or Order object
 */
function loadShippingAddress(copyFrom, copyTo) {
    var shipAddr = copyFrom.getDefaultShipment() != null ? copyFrom.getDefaultShipment().getShippingAddress() : null;
    if (shipAddr != null) {
        var basket = copyTo;
        var defaultShipment = basket.getDefaultShipment();
        Transaction.wrap(function () {
            var shippingAddress = defaultShipment.createShippingAddress();
            shippingAddress.setFirstName(shipAddr.firstName);
            shippingAddress.setLastName(shipAddr.lastName);
            shippingAddress.setAddress1(shipAddr.address1);
            shippingAddress.setAddress2(shipAddr.address2);
            shippingAddress.setCity(shipAddr.city);
            shippingAddress.setPostalCode(shipAddr.postalCode);
            shippingAddress.setStateCode(shipAddr.stateCode);
            shippingAddress.setCountryCode(shipAddr.countryCode.value);
            shippingAddress.setPhone(shipAddr.phone);
        });
    }
}

/**
 * Copied Billing Address
 *
 * @param  {dw.order.LineItemCtnr} copyFrom Basket or Order object
 * @param  {dw.order.LineItemCtnr} copyTo Basket or Order object
 */
function loadBillingAddress(copyFrom, copyTo) {
    var billAddr = copyFrom.getBillingAddress();
    if (billAddr != null) {
        var basket = copyTo;
        Transaction.wrap(function () {
            var billingAddress = basket.createBillingAddress();
            billingAddress.setFirstName(billAddr.firstName);
            billingAddress.setLastName(billAddr.lastName);
            billingAddress.setAddress1(billAddr.address1);
            billingAddress.setAddress2(billAddr.address2);
            billingAddress.setCity(billAddr.city);
            billingAddress.setPostalCode(billAddr.postalCode);
            billingAddress.setStateCode(billAddr.stateCode);
            billingAddress.setCountryCode(billAddr.countryCode.value);
            billingAddress.setPhone(billAddr.phone);

            basket.customerEmail = copyFrom.customerEmail;
        });
    }
}

/**
 * Copied Billing Address
 *
 * @param  {dw.order.LineItemCtnr} copyFrom Basket or Order object
 * @param  {dw.order.LineItemCtnr} copyTo Basket or Order object
 */
function loadStoreAndSlot(copyFrom, copyTo) {
    Transaction.wrap(function () {
        copyTo.custom.reservedDeliverySlot = copyFrom.custom.reservedDeliverySlot;
        copyTo.custom.facilityId = copyFrom.custom.facilityId;
        copyTo.custom.reservationId = copyFrom.custom.reservationId;
        copyTo.custom.slotId = copyFrom.custom.slotId;
        copyTo.custom.isScheduledOrder = copyFrom.custom.isScheduledOrder;
        copyTo.custom.orderStoreId = copyFrom.custom.orderStoreId;
        copyTo.custom.scheduledStartTime = copyFrom.custom.scheduledStartTime;
        copyTo.custom.scheduledEndTime = copyFrom.custom.scheduledEndTime;
    });
}

/**
 * Copy Credit Card information from {copyFrom} payment instrument to {copyTo} payment instrument
 * Used to display valid info in BM and in TransientModel
 *
 * @param {dw.order.PaymentInstrument} copyFrom - Payment instrument
 * @param {dw.order.PaymentInstrument} copyTo - Payment instrument
 */
function loadCreditCardInformation(copyFrom, copyTo) {
    Transaction.wrap(function () {
        copyTo.setCreditCardHolder(copyFrom.getCreditCardHolder());
        copyTo.setCreditCardNumber(copyFrom.getCreditCardNumber());

        copyTo.setCreditCardExpirationMonth(copyFrom.getCreditCardExpirationMonth());
        copyTo.setCreditCardExpirationYear(copyFrom.getCreditCardExpirationYear());
        copyTo.setCreditCardType(copyFrom.getCreditCardType());
        if (copyFrom.getCreditCardToken() != null && !empty(copyFrom.getCreditCardToken())) {
            copyTo.setCreditCardToken(copyFrom.getCreditCardToken());
        }
    });
}

/**
 * Copy Payment Instruments
 * Used only when Basket should be copied to Order after successful order edit flow.
 *
 * @param  {dw.order.LineItemCtnr} copyFrom Basket or Order object
 * @param  {dw.order.LineItemCtnr} copyTo Basket or Order object
 */
function loadPaymentInstruments(copyFrom, copyTo) {
    var paymentInstruments = copyFrom.getPaymentInstruments();

    if (paymentInstruments.length > 0) {
        Transaction.wrap(function () {
            copyTo.removeAllPaymentInstruments();
        });
    }
    Transaction.wrap(function () {
        for (var i = 0; i < paymentInstruments.length; i += 1) {
            var pi = paymentInstruments[i];

            var paymentInstrument = copyTo.createPaymentInstrument(pi.paymentMethod, pi.paymentTransaction.amount);
            var paymentProcessor = dw.order.PaymentMgr.getPaymentMethod(pi.getPaymentMethod()).getPaymentProcessor();
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.setTransactionID(pi.paymentTransaction.transactionID);
            // paymentInstrument.paymentTransaction.setType(pi.paymentTransaction.getType().value);

            loadCreditCardInformation(pi, paymentInstrument);

            copyCustomAttributes(pi, paymentInstrument);
            copyCustomAttributes(pi.paymentTransaction, paymentInstrument.paymentTransaction);
        }
    });
}

/**
 * Function that defines is the current checkout flow in editing mode or not
 * @param {Object} req - the request object needed to access session.privacyCache
 * @return {boolean} - returns true if an order is being edited in the session
 */
function isOrderInEditMode(req) {
    return (req.session.privacyCache.get('orderNoBeingEdited') != null);
}

/**
 * Generate basket hash for {basket} object.
 * @param {dw.order.LineItemCtnr} basket /order object
 *
 * @returns {string} encoded hash string
 */
function generateBasketHash(basket) {
    var hash = 'sku-';
    for (var i = 0; i < basket.productLineItems.length; i += 1) {
        var productLineItem = basket.productLineItems[i];
        hash += productLineItem.productID + '-q-' + productLineItem.quantityValue + '|';
    }
    hash += '-p-' + basket.totalGrossPrice.value;

    // return dw.util.StringUtils.encodeBase64(hash);
    return hash;
}

/**
 * Copy Order product line items to the current basket.
 *
 * @param  {dw.order.LineItemCtnr|Object} storedOrder - Order to be edited
 * @param  {dw.order.LineItemCtnr} basket - current basket
 */
function mergeBaskets(storedOrder, basket) {
    var currentBasket = basket;
    var storedPlis = storedOrder.productLineItems;

    var currentPlis;
    if (basket != null) {
        currentPlis = currentBasket.productLineItems;
    }
    Transaction.wrap(function () {
        for (var q = 0; q < storedPlis.length; q += 1) {
            var productInCart = null;
            var quantityInCart;
            var quantityToSet;
            var pli = storedPlis[q];
            if ('bonusProductLineItem' in pli && pli.bonusProductLineItem) {
                // if pli is bonusProduct we should not copy it manually like productLineItem
                // another function will do that
            } else {
                for (var i = 0; currentPlis != null && i < currentPlis.length; i += 1) {
                    if (currentPlis[i].productID === pli.productID) {
                        productInCart = currentPlis[i];
                        break;
                    }
                }
                if (productInCart) {
                    quantityInCart = productInCart.getQuantityValue();
                    quantityToSet = quantityInCart + pli.quantityValue;
                    // ensure the max quantity is not exceeded
                    var maxValue = getProductMaxQuantity(productInCart.getProduct());
                    var setQty = quantityToSet > maxValue ? maxValue : quantityToSet;

                    productInCart.setQuantityValue(setQty);
                    productInCart.custom.allowReplacement = pli.custom.allowReplacement;
                } else {
                    var createdProductLineItem = currentBasket.createProductLineItem(pli.productID, currentBasket.getDefaultShipment());
                    createdProductLineItem.setQuantityValue(pli.quantityValue);
                    createdProductLineItem.custom.allowReplacement = pli.custom.allowReplacement;
                }
            }
        }
    });
}

/**
 * Copy Product Line items from one object to another
 *
 * @param  {dw.order.LineItemCtnr|Object} copyFrom Basket or Order object
 * @param  {dw.order.LineItemCtnr} copyTo Basket or Order object
 */
function copyProductLineItems(copyFrom, copyTo) {
    var shipment = copyTo.getDefaultShipment();

    if (copyFrom.productLineItems.length > 0) {
        Transaction.wrap(function () {
            for (var q = 0; q < copyFrom.productLineItems.length; q += 1) {
                var pli = copyFrom.productLineItems[q];
                if (pli.product !== null && 'isAddToCartDisabled' in pli.product.custom && pli.product.custom.isAddToCartDisabled === true) {
                // Do not add products that have add to cart disabled
                } else if ('bonusProductLineItem' in pli && pli.bonusProductLineItem) {
                    // if pli is bonusProduct we should not copy it manually like productLineItem
                    // another function will do that
                } else {
                    try {
                        var createdProductLineItem = copyTo.createProductLineItem(pli.productID, shipment);
                        createdProductLineItem.setQuantityValue(pli.quantityValue);

                        copyCustomAttributes(pli, createdProductLineItem);
                    } catch (e) {
                        Logger.error('Coupon cannot be added');
                    }
                }
            }
        });
    }
}

/**
 * Remove lineItemCtnr container data that was from the order being edited
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr Basket or Order object
 */
function clearLineItemCtnrData(lineItemCtnr) {
    clearProductLineItems(lineItemCtnr);
    clearShippingAndBilling(lineItemCtnr);

    applyDefaultShippingAddress(lineItemCtnr);
    clearPaymentInstruments(lineItemCtnr);
    clearCouponLineItems(lineItemCtnr);
}

/**
 * This function is called to save basket to the order when user decides to save changes to the edited order
 *
 * @param  {dw.order.LineItemCtnr} basket - basket object
 * @param  {dw.order.LineItemCtnr|Object} storedOrderObj - order to be edited
 * @return {boolean} - true or false
 */
function saveBasketToScheduledOrder(basket, storedOrderObj) {
    clearProductLineItems(storedOrderObj);
    copyProductLineItems(basket, storedOrderObj);

    loadBonusDiscountLineItems(basket, storedOrderObj);
    loadShippingMethod(basket, storedOrderObj);
    loadShippingAddress(basket, storedOrderObj);
    loadBillingAddress(basket, storedOrderObj);
    loadPaymentInstruments(basket, storedOrderObj);

    Transaction.wrap(function () {
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        basketCalculationHelpers.calculateTotals(storedOrderObj);
        storedOrderObj.custom.allowReplacement = basket.custom.allowReplacement;
        var orderHash = generateBasketHash(storedOrderObj);

        storedOrderObj.addNote('Order Edited By the Customer', orderHash);
    });

    if (storedOrderObj.custom.reservationId !== basket.custom.reservationId) {
        // Cancel reservation slot
        var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
        var result = storeHelpers.reserveOrCancelReservation(false, basket.custom.reservationId);
        if (result.ok) {
            result = storeHelpers.reserveOrCancelReservation(true, storedOrderObj.custom.reservationId);
            if (result.ok) {
                loadStoreAndSlot(basket, storedOrderObj);
                Logger.debug('Save Success');
            } else {
                Logger.debug('Cancel Fail');
                return false;
            }
        } else {
            Logger.debug('Save Fail');

            return false;
        }
    }

    return true;
}

/**
 * This function is called to save basket to the order when user decides to save changes to the edited order
 *
 * @param  {dw.order.LineItemCtnr} basket - basket object
 * @param  {dw.order.LineItemCtnr|Object} storedOrderObj - order to be edited
 * @return {boolean} - true or false
 */
function saveAgentBasketToScheduledOrder(basket, storedOrderObj) {
    clearProductLineItems(storedOrderObj);
    // copyProductLineItems(basket, storedOrderObj);
    var shipment = storedOrderObj.getDefaultShipment();

    var basketJson = JSON.parse(basket);
    Logger.debug('currentBasket SKU 1' + basketJson.order.items.length);

    Transaction.wrap(function () {
        for (var q = 0; q < basketJson.order.items.length; q += 1) {
            Logger.debug('currentBasket SKU 1' + basketJson.order.items[q].sku);
            Logger.debug('currentBasket SKU qty' + basketJson.order.items[q].qty);

            var createdProductLineItem = storedOrderObj.createProductLineItem(basketJson.order.items[q].sku, shipment);
            // eslint-disable-next-line radix
            createdProductLineItem.setQuantityValue(parseInt(basketJson.order.items[q].qty));
        }

        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        basketCalculationHelpers.calculateTotals(storedOrderObj);
        var orderHash = generateBasketHash(storedOrderObj);

        storedOrderObj.addNote('Order Edited By the Store Associate', orderHash);
    });

    return true;
}

/**
 * This function is used to load a saved scheduled order in the basket when user decides to edit an order
 * @param  {dw.order.LineItemCtnr|Object} storedOrderObj - Order to be edited
 * @param  {dw.order.LineItemCtnr} basket - current basket
 * @param  { boolean } mergeWithCurrentBasket true if need to be merged with current basket, else false
 *
 */
function loadOrderInBasket(storedOrderObj, basket, mergeWithCurrentBasket) {
    if (mergeWithCurrentBasket != null && mergeWithCurrentBasket === 'true') {
        mergeBaskets(storedOrderObj, basket);
    } else {
        clearProductLineItems(basket);
        mergeBaskets(storedOrderObj, basket);
    }
    Transaction.wrap(function () {
        basket.custom.allowReplacement = storedOrderObj.custom.allowReplacement;
    });

    loadBonusDiscountLineItems(storedOrderObj, basket);
    loadShippingMethod(storedOrderObj, basket);
    loadShippingAddress(storedOrderObj, basket);
    loadBillingAddress(storedOrderObj, basket);
    loadCoupons(storedOrderObj, basket);
    loadStoreAndSlot(storedOrderObj, basket);
}

exports.isOrderInEditMode = isOrderInEditMode;
exports.loadOrderInBasket = loadOrderInBasket;
exports.clearProductLineItems = clearProductLineItems;
exports.saveBasketToScheduledOrder = saveBasketToScheduledOrder;
exports.clearLineItemCtnrData = clearLineItemCtnrData;
exports.generateBasketHash = generateBasketHash;
exports.saveAgentBasketToScheduledOrder = saveAgentBasketToScheduledOrder;
