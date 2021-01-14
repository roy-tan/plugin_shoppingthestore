'use strict';

/**
 * Registry.js
 */

/**
 * Cartridge script path
 * @const {string}
 * @private
 */
var path = '/plugin_shoppingthestore/cartridge/';

/**
 * Registry object
 * @type {{authToken: module:plugin_shoppingthestore.authToken}}
 * @exports plugin_shoppingthestore
 */
var Registry = {
    /**
     * @returns {module:models/authToken~AuthToken} Instance of AuthToken
     */
    authToken: function () {
        /**
         * @type {module:models/authToken~AuthToken}
         */
        var Model = require(path + 'models/authToken');
        return new Model();
    }
};

module.exports = Registry;
