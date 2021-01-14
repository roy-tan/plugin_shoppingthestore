'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for the assets.headlinebanner.
 * @param {*} context - context
 * @return {*} the rendered template
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;

    var storeId = 'chstore1'; /* Default for Page Designer preview */
    if (request.httpParameters.params && request.httpParameters.params.length > 0) {
        var params = JSON.parse(request.httpParameters.params[0]);
        var queryString = '{"' + JSON.parse(params.custom).queryString.replace('=', '":"').replace('&', '","') + '"}';
        storeId = JSON.parse(queryString).storeId;
    }
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var store = storeHelpers.getStore(storeId);

    model.storename = store.name;
    model.storedescription = store.storeHours;
    model.detailname = content.detailname;
    model.detaildescription = store.storeEvents;

    return new Template('experience/components/assets/storeprofileDescription').render(model).text;
};
