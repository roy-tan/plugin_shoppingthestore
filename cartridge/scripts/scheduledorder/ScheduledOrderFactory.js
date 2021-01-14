
/**
 * Name: ScheduledOrderFactory.js
 *
 * Holds constants, preferences, and has helper
 * functions for order delivery.
 */

var BasketMgr = require('dw/order/BasketMgr');

/* Script Modules */

var ScheduledOrderFactory = {
    PAYMENT_FLOW: {
        ORDER_TOTAL_IS_EQUAL: 1,
        ORDER_TOTAL_IS_GREATER: 2,
        ORDER_TOTAL_IS_LESS: 3
    },

    /**
* Function is used to check if incoming order fulfills the criteria for allowing editing of an order
* - Order should belong to the customer
* - Order should be in the edit time window
* - Order should not have been edited for more than allowed number of times.
* @param {dw.order.Order} order obj - Order object
* @returns {boolean} if current customer id match customer id in order  return true, else return false.
*/
    isOrderEditAllowed: function (order) {
        if (order != null) {
            if (Object.hasOwnProperty.call(order, 'orderNo')) {
                return this.isOrderBelongToCustomer(order) && this.isOrderEditTimeWindowOpen(order) &&
            !this.isMaxOrderEditCntReached(order) && order.status.value === dw.order.Order.ORDER_STATUS_CREATED;
            }
            return false;
        }
        return false;
    },

    /**
* Function used to check if order belongs to the current logged in customer or not.
*
* @param {dw.order.Order} order obj - Order object
* @returns {boolean} if current customer id match customer id in order  return true, else return false.
*/
    isOrderBelongToCustomer: function (order) {
        var customerNumber;
        if (order != null) {
            customerNumber = order.customerNo;
            return customer.authenticated && customer.profile != null &&
customerNumber === customer.profile.customerNo;
        }
        return false;
    },

    /**
 * Function used to check if order belongs to the current logged in customer or not.
 * @param {dw.order.Order} order obj - Order object
 * @returns {boolean} if current customer id match customer id in order  return true, else return false.
 */
    isOrderInCustomerZipCode: function (order) {
        if (order != null && customer.profile != null) {
            var customerStoreId = 'preferredStoreId' in customer.profile.custom ? customer.profile.custom.preferredStoreId : '';
            var orderStoreId = 'orderStoreId' in order.custom ? order.custom.orderStoreId : '';
            return customerStoreId.toUpperCase() === orderStoreId.toUpperCase();
        }
        return false;
    },

    /**
* Return TRUE if max order edits number is reached.
*
* @param {dw.order.Order} order obj - Order Object
* @return {boolean} - returns true if max order edit count reached , else returns false
*/
    isMaxOrderEditCntReached: function (order) {
        var orderEditCounter = 'orderEditCounter' in order.custom ? order.custom.orderEditCounter : '0';
        var maxOrderEdits = dw.system.Site.getCurrent()
            .getCustomPreferenceValue('maxOrderEditsAllowed');
        // var Logger = require('dw/system/Logger');

        if (orderEditCounter == null || maxOrderEdits == null) {
            return false;
        }

        var cnt = parseInt(orderEditCounter, 10) >= parseInt(maxOrderEdits, 10);
        return cnt;
    },

    /**
* Return Boolean value if delivery window time is closed return true or else return false
*
* @param {dw.order.LineItemCtnr} order - basket/order object
* @returns {boolean} true if delivery window expired, false otherwise
*/
    isOrderEditTimeWindowOpen: function (order) {
        var currentTime = dw.system.Site.current.calendar;
        var deliveryExpTime = new dw.util.Calendar(this
            .getOrderEditAccessExpiryTime(order));

        return currentTime.before(deliveryExpTime);
    },

    /**
* Return the date when the edit access expires
*
* @param {dw.order.LineItemCtnr} order - basket/order object
* @returns {Date} the time when the edit window expires
*/
    getOrderEditAccessExpiryTime: function (order) {
        var expirationTime = dw.system.Site.getCurrent()
            .getCustomPreferenceValue('scheduledEditOrderExprTime');

        var scheduledStartTime = 'scheduledStartTime' in order.custom ? order.custom.scheduledStartTime : '';
        var deliveryExpTime = dw.system.Site.current.calendar;

        if (!empty(scheduledStartTime)) {
            deliveryExpTime = new dw.util.Calendar(scheduledStartTime);
        }
        deliveryExpTime.add(dw.util.Calendar.HOUR_OF_DAY, expirationTime);

        return deliveryExpTime.time;
    },

    isNewPaymentMethodNeeded: function (orderTotal, req) {
        var order = dw.order.OrderMgr.getOrder(req.session.privacyCache.get('orderNoBeingEdited'));

        var authTotalPrice = ScheduledOrderFactory.getAuthTotal(order);

        return (orderTotal.value > req.session.privacyCache.get('orderOriginalTotalPrice') &&
orderTotal.value > authTotalPrice.value);
    },

    isPaymentAuthorised: function (currentBasket, order) {
        var origOrderAuthTotalPrice = ScheduledOrderFactory.getAuthTotal(order);
        var orderTotal = currentBasket.totalGrossPrice;
        var basketAuthTotalPrice = ScheduledOrderFactory.getAuthTotal(currentBasket);
        var Logger = require('dw/system/Logger');

        Logger.debug('orderTotal' + orderTotal);
        Logger.debug('origOrderAuthTotalPrice' + origOrderAuthTotalPrice);
        Logger.debug('basketAuthTotalPrice' + basketAuthTotalPrice);

        var isPayAuthorized = false;
        if (basketAuthTotalPrice.value !== 0) {
            isPayAuthorized = basketAuthTotalPrice.value >= orderTotal.value;
        } else {
            isPayAuthorized = origOrderAuthTotalPrice.value >= orderTotal.value;
        }
        return isPayAuthorized;
    },

    /**
* Return total authorized amount for edited order
* @param {Object} order - order object to get the authorized amount value
* @return {dw.value.Money} - total auth amount
*/
    getAuthTotal: function (order) {
        var paymentInstrumentsTotalAmount = new dw.value.Money(
            0,
            order.currencyCode
        );
        var paymentInstruments = order.getPaymentInstruments();
        for (var i = 0; i < paymentInstruments.length; i += 1) {
            var paymentInstrument = paymentInstruments[i];

            paymentInstrumentsTotalAmount = paymentInstrumentsTotalAmount
                .add(paymentInstrument.paymentTransaction.getAmount());
        }

        return paymentInstrumentsTotalAmount;
    },

    /**
* Calculates amount to refund in order edit flow.
* This amount used only for UI.
* @param {Object} req - the request object needed to access session.privacyCache
*
* @return {dw.value.Money} - Amount to be refunded based on the new order total
*/
    getRefundAmount: function (req) {
        var CartModel = require('*/cartridge/models/cart');

        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var cart = new CartModel(currentBasket);

        var currentTotal = cart.object.totalGrossPrice;
        var originalTotal = req.session.privacyCache.get('orderOriginalTotalPrice');

        return originalTotal.subtract(currentTotal);
    },

    /**
 * This function increments the orderEditCounter in the Order, called from ScheduledOrder-SaveChanges
 *
 * @param {dw.order.Order} order - order object
 */
    increaseOrderEditCounter: function (order) {
        var orderObj = order;
        var Transaction = require('dw/system/Transaction');

        var counter = 'orderEditCounter' in order.custom ? order.custom.orderEditCounter : '0';
        if (counter != null && !empty(counter)) {
            counter = Number(counter);
            counter += 1;
        } else {
            counter = Number(1);
        }

        Transaction.wrap(function () {
            orderObj.custom.orderEditCounter = Number(counter.toFixed());
        });
    },

    /**
 * In this function we add/remove coupons from Order that has been added/removed during order edit
 * to Basket object
 * NOTE: no params passed, we ensure that this function will only use in order edit mode.
 *  @param {Object} req - the request object needed to access session.privacyCache
 */
    adjustCouponLineItems: function (req) {
        var basket = BasketMgr.getCurrentOrNewBasket();
        var order = dw.order.OrderMgr.getOrder(req.session.privacyCache.get('orderNoBeingEdited'));

        var couponLIToRemove = new dw.util.ArrayList();
        var couponLIToAdd = new dw.util.ArrayList();
        var couponLI = null;

        for (var i = 0; i < order.couponLineItems.length; i += 1) {
            couponLI = order.couponLineItems[i];
            // coupon code has been removed from basket, we should remove from order
            if (basket.getCouponLineItem(couponLI.couponCode) == null) {
                couponLIToRemove.add(couponLI);
            }
        }

        for (var k = 0; k < basket.couponLineItems.length; k += 1) {
            couponLI = basket.couponLineItems[k];
            // coupon code has been added during order edit to basket, we should add to order
            if (order.getCouponLineItem(couponLI.couponCode) == null) {
                couponLIToAdd.add(couponLI);
            }
        }

        var j = 0;
        if (couponLIToRemove.length > 0) {
            dw.system.Transaction.wrap(function () {
                for (j = 0; j < couponLIToRemove.length; j += 1) {
                    order.removeCouponLineItem(couponLIToRemove[j]);
                }
            });
        }

        if (couponLIToAdd.length > 0) {
            dw.system.Transaction.wrap(function () {
                for (j = 0; j < couponLIToAdd.length; j += 1) {
                    order.createCouponLineItem(couponLIToAdd[j].couponCode, true);
                }
            });
        }
    }
};

module.exports = ScheduledOrderFactory;
