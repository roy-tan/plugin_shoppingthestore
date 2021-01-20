'use strict';

var base = module.superModule;

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    var ScheduledOrderFactory = require('*/cartridge/scripts/scheduledorder/ScheduledOrderFactory');

    base.call(this, lineItemContainer, options);
    var Logger = require('dw/system/Logger');
    Logger.debug('model {0}', ScheduledOrderFactory.isMaxOrderEditCntReached(lineItemContainer));
    this.isMaxOrderEditCntReached = ScheduledOrderFactory.isMaxOrderEditCntReached(lineItemContainer);
    this.isOrderEditTimeWindowOpen = ScheduledOrderFactory.isOrderEditTimeWindowOpen(lineItemContainer);
    this.isOrderEditAllowed = ScheduledOrderFactory.isOrderEditAllowed(lineItemContainer);
    this.allowReplacement = lineItemContainer.custom.allowReplacement;
    this.orderStoreId = lineItemContainer.custom.orderStoreId;

    var startDate = null;
    var endDate = null;

    if (lineItemContainer.custom.scheduledStartTime != null) {
        startDate = new Date(lineItemContainer.custom.scheduledStartTime);
    }

    if (lineItemContainer.custom.scheduledEndTime != null) {
        endDate = new Date(lineItemContainer.custom.scheduledEndTime);
    }

    if (startDate != null) {
        this.slotStartDate = startDate.toDateString();
        this.slotStartTime = startDate.toTimeString().substring(0, 5);
    }

    if (endDate != null) {
        this.slotEndTime = endDate.toTimeString().substring(0, 5);
    }
}

OrderModel.prototype = Object.create(base.prototype);

module.exports = OrderModel;
