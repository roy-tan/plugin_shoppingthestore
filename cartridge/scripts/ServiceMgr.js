'use strict';

/**
 * @module ServiceMgr
 */

/**
 * Service Cloud Services Manager
 */

/**
 * @type {dw.svc.LocalServiceRegistry}
 */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * @type {module:services/auth}
 */
var auth = require('./services/auth');
/**
 * @type {module:services/rest}
 */
var rest = require('./services/rest');

var SERVICES = {
    rest: 'Time Based Inventory Reservation APIs',
    auth: 'Account Manager Token'
};

var DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

/**
 * Returns the service related to the given {serviceID} initialized with the given {definition}
 *
 * @param {string} serviceID Id of the service
 * @param {Object} definition service definition
 *
 * @returns {dw/svc/Service} return the service
 */
function getService(serviceID, definition) {
    return LocalServiceRegistry.createService(serviceID, definition);
}

module.exports = {
    DATE_FORMAT: DATE_FORMAT,
    /**
     * Returns a new instance of the Service Cloud Auth Service
     *
     * @returns {dw/svc/Service} returns the servcie
     */
    auth: function () {
        return getService(SERVICES.auth, auth);
    },

    restEndpoints: rest.endpoints,

    /**
     * Returns a new instance of the Service Cloud REST Service initialized with the {get} definitions
     *
     * @returns {dw/svc/Service} return the service
     */
    restGet: function () {
        return getService(SERVICES.rest, rest.definitions.get);
    },

    /**
     * Returns a new instance of the Service Cloud REST Service initialized with the {patch} definitions
     *
     * @returns {dw/svc/Service} return the service
     */
    restPatch: function () {
        return getService(SERVICES.rest, rest.definitions.patch);
    },

    /**
     * Returns a new instance of the Service Cloud REST Service initialized with the {put} definitions
     *
     * @returns {dw/svc/Service} return the service
     */
    restPut: function () {
        return getService(SERVICES.rest, rest.definitions.put);
    },

    /**
     * Returns a new instance of the Service Cloud REST Service initialized with the {delete} definitions
     *
     * @returns {dw/svc/Service} return the service
     */
    restDelete: function () {
        return getService(SERVICES.rest, rest.definitions.delete);
    },

    /**
     * Returns a new instance of the Service Cloud REST Service initialized with the {get} definitions
     *
     * @returns {dw/svc/Service} return the service
     */
    restQuery: function () {
        return getService(SERVICES.rest, rest.definitions.query);
    },

    /**
     * Returns a new instance of the Service Cloud REST Service initialized with the {create} definitions
     *
     * @returns {dw/svc/Service} return the service
     */
    restCreate: function () {
        return getService(SERVICES.rest, rest.definitions.create);
    },

    /**
     * Returns a new instance of the Service Cloud REST Service initialized with the {update} definitions
     *
     * @returns {dw/svc/Service} return the service
     */
    restUpdate: function () {
        return getService(SERVICES.rest, rest.definitions.update);
    }
};
