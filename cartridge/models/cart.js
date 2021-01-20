
'use strict';

var URLUtils = require('dw/web/URLUtils');
var ProductMgr = require('dw/catalog/ProductMgr');

var base = module.superModule;

/**
 * Generates an object of URLs
 * @returns {Object} an object of URLs in string format
 */
function getCartActionUrls() {
    return {
        removeProductLineItemUrl: URLUtils.url('Cart-RemoveProductLineItem').toString(),
        updateQuantityUrl: URLUtils.url('Cart-UpdateQuantity').toString(),
        selectShippingUrl: URLUtils.url('Cart-SelectShippingMethod').toString(),
        submitCouponCodeUrl: URLUtils.url('Cart-AddCoupon').toString(),
        removeCouponLineItem: URLUtils.url('Cart-RemoveCouponLineItem').toString(),
        updateReplacementToggle: URLUtils.url('Cart-UpdateReplacementToggle').toString()

    };
}

/**
*
* @param {Category} category a category
* @returns {category} the L1 ancestor of the category
*/
function getProductCategoryL1(category) {
    if (category == null || category.root) {
        return null;
    }
    if (category.topLevel) {
        return category;
    }
    return getProductCategoryL1(category.parent);
}

/**
*
* @param {*} items list of product line items
* @returns {Collection} the products grouped by category
*/
function groupItemsByCategory(items) {
    var groupedByCategory = {};
    var root;
    var categoryGroups = [];

    items.forEach(function (item) {
        // eslint-disable-next-line no-undef
        var product = ProductMgr.getProduct(item.id);
        if (product) {
            var category = getProductCategoryL1(item.categoryID);
            if (category) {
                root = category.parent;
                if (groupedByCategory[category.ID] == null) {
                    groupedByCategory[category.ID] = {
                        category: category,
                        items: [],
                        groupQty: 0
                    };
                }
                groupedByCategory[category.ID].items.push(item);
                groupedByCategory[category.ID].groupQty += item.quantity;
            }
        }
    });

    if (root) {
        var toplevels = root.onlineSubCategories.iterator();
        while (toplevels.hasNext()) {
            var cat = toplevels.next();
            var group = groupedByCategory[cat.ID];
            if (group) {
                categoryGroups.push({
                    displayName: cat.displayName,
                    id: cat.ID,
                    items: group.items,
                    groupQty: group.groupQty.toFixed()
                });
            }
        }
    }

    return categoryGroups;
}

/**
 * @constructor
 * @classdesc CartModel class that represents the current basket
 *
 * @param {dw.order.Basket} basket - Current users's basket
 */
function CartModel(basket) {
    base.call(this, basket);
    this.actionUrls = getCartActionUrls();
    if (basket != null) {
        this.allowReplacement = Boolean(basket.custom.allowReplacement);

        var Site = require('dw/system/Site');
        var groupByCategoryInCart = Site.getCurrent().getCustomPreferenceValue('groupByCategoryInCart');

        this.groupByCategoryInCart = groupByCategoryInCart;

        if (groupByCategoryInCart === 'true' || groupByCategoryInCart === true) {
            this.groupedItems = groupItemsByCategory(this.items);
        }

        var startDate = null;
        var endDate = null;

        if (basket.custom.scheduledStartTime != null) {
            startDate = new Date(basket.custom.scheduledStartTime);
        }

        if (basket.custom.scheduledEndTime != null) {
            endDate = new Date(basket.custom.scheduledEndTime);
        }

        if (startDate != null) {
            this.slotStartDate = startDate.toDateString();
            this.slotStartTime = startDate.toTimeString().substring(0, 5);
        }

        if (endDate != null) {
            this.slotEndTime = endDate.toTimeString().substring(0, 5);
        }
    }
}

CartModel.prototype = Object.create(base.prototype);
module.exports = CartModel;
