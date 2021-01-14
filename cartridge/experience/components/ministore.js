'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Component which renders the grocery stroe selection component - ideally used in the sfra page header
 * @param {dw.experience.PageScriptContext} context The page script context object.
 *
 * @returns {string} The template text
 */
module.exports.render = function () {
    var model = new HashMap();

    return new Template('experience/components/decorator/storeicon').render(model).text;
};
