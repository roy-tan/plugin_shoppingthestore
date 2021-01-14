'use strict';

/**
 * @module util/helpers
 */

/**
 * Checks if submitted value type is an Object (and not an Array)
 * @param {*} obj Object to be checked
 * @returns {boolean} true if it is an object
 * @static
 */
function isObject(obj) {
    return typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * Uppercases first char of string
 * @param {string} str String to uppercase
 * @returns {string} string with first uppercase
 * @static
 */
function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Expands JSON
 * @param {string} jsonString string to be expanded
 * @param {*} defaultValue value if jsonString is empty
 *
 * @returns {*} Returns null if empty string or exception encountered
 */
function expandJSON(jsonString, defaultValue) {
    var output;
    try {
        output = jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (e) {
        // Catch exception from invalid JSON
        require('dw/system/Logger').error('Error parsing JSON: {0}', e);
        output = defaultValue;
    }
    return output;
}

/**
 * Fetches object definition from Custom Object, creating it if not exists
 * @param {string} customObjectName name of the custom object
 * @param {string} objectID id of the custom object
 * @returns {dw.object.CustomAttributes} the custom attributes
 */
function getCustomObject(customObjectName, objectID) {
    var com = require('dw/object/CustomObjectMgr');
    var objectDefinition = com.getCustomObject(customObjectName, objectID);
    // eslint-disable-next-line no-undef
    if (empty(objectDefinition)) {
        require('dw/system/Transaction').wrap(function () {
            objectDefinition = com.createCustomObject(customObjectName, objectID);
        });
    }
    return objectDefinition.getCustom();
}

exports.isObject = isObject;
exports.ucfirst = ucfirst;
exports.expandJSON = expandJSON;
exports.getCustomObject = getCustomObject;
