'use strict';

var base = module.superModule;

var assign = require('server/assign');

var collections = require('*/cartridge/scripts/util/collections');

var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
/**
 * Transfers current session's store address to shipping address of passed shipment
 * @param {w.order.Shipment} defaultShipment - default shipment of current users's basket
 */
function setStoreAddressAsShippingAddr(defaultShipment) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var ShippingMgr = require('dw/order/ShippingMgr');

    if (defaultShipment.shippingMethod == null) {
        var shippingMethods = ShippingMgr.getShipmentShippingModel(defaultShipment).getApplicableShippingMethods();

        var shippingMethod = collections.find(shippingMethods, function(method) {
            return method.defaultMethod;
        });

        Transaction.wrap(function() {
            defaultShipment.shippingMethod = shippingMethod;
        });
    }
    var storePickupEnabled = defaultShipment.shippingMethod.custom.storePickupEnabled;

    var storeId = session.custom.preferredStoreId;

    if (storePickupEnabled) {
        var store = StoreMgr.getStore(storeId);
        var storeAddress = {
            address: {
                firstName: store.name,
                lastName: store.name,
                address1: store.address1,
                address2: store.address2,
                city: store.city,
                stateCode: store.stateCode,
                postalCode: store.postalCode,
                countryCode: store.countryCode.value,
                phone: store.phone
            }
        };
        base.copyShippingAddressToShipment(storeAddress, defaultShipment);
    } else {
        Transaction.wrap(function() {
            defaultShipment.createShippingAddress();
        });
    }
}

/**
 * Copies information from the shipping form to the associated shipping address
 * @param {Object} shippingData - the shipping data
 * @param {dw.order.Shipment} [shipmentOrNull] - the target Shipment
 */
function copyShippingAddressToShipment(shippingData, shipmentOrNull) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;

    var shippingAddress = shipment.shippingAddress;

    Transaction.wrap(function() {
        if (shippingAddress === null) {
            shippingAddress = shipment.createShippingAddress();
        }

        shippingAddress.setFirstName(shippingData.address.firstName);
        shippingAddress.setLastName(shippingData.address.lastName);
        shippingAddress.setAddress1(shippingData.address.address1);
        shippingAddress.setAddress2(shippingData.address.address2);
        shippingAddress.setCity(shippingData.address.city);
        shippingAddress.setPostalCode(shippingData.address.postalCode);
        shippingAddress.setStateCode(shippingData.address.stateCode);
        var countryCode = shippingData.address.countryCode.value ? shippingData.address.countryCode.value : shippingData.address.countryCode;
        shippingAddress.setCountryCode(countryCode);
        shippingAddress.setPhone(shippingData.address.phone);

        var Logger = require('dw/system/Logger');
        Logger.debug('shippingData.shippingMethod ' + shippingData.shippingMethod);

        var storePickupEnabled = shipment.shippingMethod.custom.storePickupEnabled;
        Logger.debug('shipment.shippingMethod ' + shipment.shippingMethod.ID);
        if (storePickupEnabled) {
            Logger.debug('storePickupEnabled' + storePickupEnabled);

            ShippingHelper.selectShippingMethod(shipment, shippingData.shippingMethod);
        }
    });
}

/**
 * Copies a raw address object to the basket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} basket - the current shopping basket
 */
function copyBillingAddressToBasket(address, basket) {
    var billingAddress = basket.billingAddress;
    // Only do copy when defaultShipment is not storepickup
    var storepickup = basket.defaultShipment.shippingMethod.custom.storePickupEnabled;
    if (!storepickup) {
        Transaction.wrap(function() {
            if (!billingAddress) {
                billingAddress = basket.createBillingAddress();
            }

            billingAddress.setFirstName(address.firstName);
            billingAddress.setLastName(address.lastName);
            billingAddress.setAddress1(address.address1);
            billingAddress.setAddress2(address.address2);
            billingAddress.setCity(address.city);
            billingAddress.setPostalCode(address.postalCode);
            billingAddress.setStateCode(address.stateCode);
            billingAddress.setCountryCode(address.countryCode.value);
            if (!billingAddress.phone) {
                billingAddress.setPhone(address.phone);
            }
        });
    }
}

/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendConfirmationEmail(order, locale) {
    var OrderModel = require('*/cartridge/models/order');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var icsHelpers = require('*/cartridge/scripts/helpers/icsHelpers');
    var Locale = require('dw/util/Locale');

    var currentLocale = Locale.getLocale(locale);

    var orderModel = new OrderModel(order, { countryCode: currentLocale.country, containerView: 'order' });

    var orderObject = { order: orderModel };

    var emailObj = {
        to: order.customerEmail,
        subject: Resource.msg('subject.order.confirmation.email', 'order', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.orderConfirmation
    };

    emailHelpers.sendEmail(emailObj, 'checkout/confirmation/confirmationEmail', orderObject);
    icsHelpers.sendCalendar(emailObj, orderObject);
}

module.exports = assign({}, base, {
    setStoreAddressAsShippingAddr: setStoreAddressAsShippingAddr,
    copyShippingAddressToShipment: copyShippingAddressToShipment,
    copyBillingAddressToBasket: copyBillingAddressToBasket,
    sendConfirmationEmail: sendConfirmationEmail
});