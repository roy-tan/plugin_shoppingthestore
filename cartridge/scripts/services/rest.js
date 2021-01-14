
'use strict';

/**
 * @module services/rest
 */

/**
 * Service Cloud REST service definition
 */

/**
 * @type {dw.util.StringUtils}
 */
var StringUtils = require('dw/util/StringUtils');

/**
 * @type {module:util/helpers}
 */
var helpers = require('../util/helpers');
var Logger = require('dw/system/Logger');

var endpoints = {
    facilityManagement: {
        list: 'api/data/facilities',
        create: 'api/data/facility',
        createMultile: 'api/data/facilities',
        Update: 'api/data/facility',
        get: 'api/data/facility{0}',
        delete: 'api/data/facility{0}'
    },
    slotManagement: {
        byFacility: 'api/data/{0}/slots',
        byResource: 'api/data/facility/{0}/slots',
        jobs: 'api/job/list',
        process: 'api/job/process'
    },
    slotReservation: {
        reserveSlotSoft: 'api/shop/reservation',
        reserveSlotConfirm: 'api/shop/reservation/{0}',
        search: 'api/shop/search'
    }
};

/**
 * Inserts auth token into request header
 *
 * @param {dw.svc.HTTPService} svc service
 * @param {string} endpoint endpoint
 *
 * @throws {Error} Throws error when no valid auth token is available (i.e.- service error, service down)
 */
function setAuthHeader(svc, endpoint) {
    var authToken = require('plugin_shoppingthestore').authToken();
    var token = authToken.getValidToken();
    if (empty(token) || !token.access_token) {
        throw new Error('No auth token available!');
    }

    svc.setAuthentication('NONE');
    svc.addHeader('Authorization', 'Bearer ' + token.access_token);
    svc.setURL(StringUtils.format('{0}/{1}', svc.URL, endpoint));
}

/**
 * Check if 401 due to expired token
 *
 * @param {dw.net.HTTPClient} client client
 *
 * @returns {boolean} true if expired auth token
 */
function isValid401(client) {
    var is401 = (client.statusCode === 401);
    var isFailureFromBadToken = false;
    try {
        var authResHeader = client.getResponseHeader('WWW-Authenticate');
        if (is401 && authResHeader) {
            isFailureFromBadToken = /^Bearer\s.+?invalid_token/.test(authResHeader);
        }
        return isFailureFromBadToken;
    } catch (e) {
        Logger.error('There was an error accessing response header, we are likely running in mocked mode? Please verify');
        return isFailureFromBadToken;
    }
}

/**
 * Check if response type is JSON
 * @param {dw.net.HTTPClient} client client
 *
 * @returns {boolean} true if respoinse is json
 */
function isResponseJSON(client) {
    try {
        var contentTypeHeader = client.getResponseHeader('Content-Type');
        return contentTypeHeader && contentTypeHeader.split(';')[0].toLowerCase() === 'application/json';
    } catch (e) {
        Logger.error('There was an error accessing response header, we are likely running in mocked mode? Please verify');
        return true;
    }
}

/**
 * Parses response JSON and wraps with an object containing additional helper properties
 * @param {dw.svc.HTTPService} svc service
 * @param {dw.net.HTTPClient} client client
 * @returns {{responseObj: Object, isError: boolean, isAuthError: boolean, isValidJSON: boolean, errorText: string}} response object
 */
function parseResponse(svc, client) {
    var isJSON = isResponseJSON(client);
    var parsedBody = client.text;

    if (isJSON) {
        parsedBody = helpers.expandJSON(client.text, {});
    }

    return {
        isValidJSON: isJSON,
        isError: client.statusCode >= 400,
        isAuthError: isValid401(client),
        responseObj: parsedBody,
        errorText: client.errorText
    };
}

/**
 * generates a mocked day slot given a date
  * @param {string} mockedTime - the date in format yyyy-mm-dd
  * @returns {array} Returns a mocked array of slots
  */
function generateMockedDaySlot(mockedTime) {
    var obj = [{
        uuid: '2tIILBl16e326rznGUa9c7' + mockedTime,
        startDateTime: mockedTime + 'T03:00:00',
        endDateTime: mockedTime + 'T04:00:00',
        availableSlots: 10,
        totalSlots: 10,
        status: 'AVAILABLE'
    },
    {
        uuid: '6Evgvrz2JQ3CxEs39nHy1V' + mockedTime,
        startDateTime: mockedTime + 'T04:00:00',
        endDateTime: mockedTime + 'T05:00:00',
        availableSlots: 10,
        totalSlots: 10,
        status: 'AVAILABLE'
    },
    {
        uuid: '7jYIdKNINesJh69m0s4PeC' + mockedTime,
        startDateTime: mockedTime + 'T05:00:00',
        endDateTime: mockedTime + 'T06:00:00',
        availableSlots: 10,
        totalSlots: 10,
        status: 'AVAILABLE'
    },
    {
        uuid: '4pv5KXKcEX1TC3z7qyiHQ1' + mockedTime,
        startDateTime: mockedTime + 'T06:00:00',
        endDateTime: mockedTime + 'T07:00:00',
        availableSlots: 10,
        totalSlots: 10,
        status: 'AVAILABLE'
    },
    {
        uuid: '1JL63ijqjD9pidJ5JZVWrK' + mockedTime,
        startDateTime: mockedTime + 'T07:00:00',
        endDateTime: mockedTime + 'T08:00:00',
        availableSlots: 10,
        totalSlots: 10,
        status: 'AVAILABLE'
    },
    {
        uuid: '4pJTo1V3je7Ql1mUkUs2uA' + mockedTime,
        startDateTime: mockedTime + 'T08:00:00',
        endDateTime: mockedTime + 'T09:00:00',
        availableSlots: 10,
        totalSlots: 10,
        status: 'AVAILABLE'
    },
    {
        uuid: '6i11D411PCijvQHl9wGOOv' + mockedTime,
        startDateTime: mockedTime + 'T09:00:00',
        endDateTime: mockedTime + 'T10:00:00',
        availableSlots: 10,
        totalSlots: 10,
        status: 'AVAILABLE'
    },
    {
        uuid: '57v3PYtHMW0htvtvCNEBwJ' + mockedTime,
        startDateTime: mockedTime + 'T10:00:00',
        endDateTime: mockedTime + 'T11:00:00',
        availableSlots: 10,
        totalSlots: 10,
        status: 'AVAILABLE'
    }];
    return obj;
}

var createAndUpdateDefinition = {
    /**
     * Create an object
     *
     * @param {dw.svc.HTTPService} svc service
     * @param {string} endpoint endpoint
     * @param {Object} modelObject A model instance to be sent to Service Cloud
     *
     * @returns {string} Request body
     */
    createRequest: function (svc, endpoint, modelObject) {
        setAuthHeader(svc, endpoint);
        svc.addHeader('Content-Type', 'application/json');

        return modelObject;
    },
    parseResponse: parseResponse,

    mockCall: function (svc, requestObj) {
        var Calendar = require('dw/util/Calendar');
        var obj = [];
        var url = svc.getURL();
        var date = new Date();
        var calendarDay1 = new Calendar(date);
        var calendarDay2 = new Calendar(date);
        var calendarDay3 = new Calendar(date);
        calendarDay1.add(Calendar.DAY_OF_YEAR, 1);
        calendarDay2.add(Calendar.DAY_OF_YEAR, 2);
        calendarDay3.add(Calendar.DAY_OF_YEAR, 3);
        var year = calendarDay1.time.getFullYear();
        var year2 = calendarDay2.time.getFullYear();
        var year3 = calendarDay3.time.getFullYear();
        var month = calendarDay1.time.getMonth() + 1;
        var month2 = calendarDay2.time.getMonth() + 1;
        var month3 = calendarDay3.time.getMonth() + 1;
        var day = calendarDay1.time.getDate(); // mocks slots for next day
        var day2 = calendarDay2.time.getDate(); // mocks slots for next next day
        var day3 = calendarDay3.time.getDate(); // mocks slots for next next next day
        var mockedTime = year + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
        var mockedTimeDay2 = year2 + '-' + (month2 < 10 ? '0' : '') + month2 + '-' + (day2 < 10 ? '0' : '') + day2;
        var mockedTimeDay3 = year3 + '-' + (month3 < 10 ? '0' : '') + month3 + '-' + (day3 < 10 ? '0' : '') + day3;
        var mockedSlots = [];
        var status = 'DRAFT';
        var slotArray = generateMockedDaySlot(mockedTime);
        var slotArrayDay2 = generateMockedDaySlot(mockedTimeDay2);
        var slotArrayDay3 = generateMockedDaySlot(mockedTimeDay3);
        slotArray.forEach(function (element) {
            mockedSlots.push(element);
        });
        slotArrayDay2.forEach(function (element) {
            mockedSlots.push(element);
        });
        slotArrayDay3.forEach(function (element) {
            mockedSlots.push(element);
        });
        if (url.indexOf('search') !== -1) {
            obj = mockedSlots;
        } else if (url.indexOf('reservation') !== -1) {
            var urlSplit = url.split('/');
            var lastElement = urlSplit[urlSplit.length - 1];
            obj = JSON.parse(requestObj);
            if (!obj.startDateTime) {
                for (var i = 0; i < mockedSlots.length; i += 1) {
                    var element = mockedSlots[i];
                    var slotId = obj.slotId;
                    if (element.uuid === slotId) {
                        obj.startDateTime = element.startDateTime;
                        obj.endDateTime = element.endDateTime;
                        obj.reservationId = obj.slotId;
                        obj.reservationExpiry = element.startDateTime;
                    }
                }
            }
            if (lastElement !== 'reservation') {
                status = 'RESERVED';
            }
            obj.status = status;
        }
        return {
            statusCode: 202,
            statusMessage: 'Accepted',
            text: JSON.stringify(obj)
        };
    }
};

var patchDefinition = {
    createRequest: function (svc, endpoint, modelObject) {
        setAuthHeader(svc, endpoint);
        svc.addHeader('Content-Type', 'application/json');

        svc.setRequestMethod('PATCH');
        return modelObject;
    },
    parseResponse: parseResponse,
    mockCall: function () {
        var obj = {
        };
        return {
            statusCode: 202,
            statusMessage: 'Accepted',
            text: JSON.stringify(obj)
        };
    }
};

var putDefinition = {
    createRequest: function (svc, endpoint, modelObject) {
        setAuthHeader(svc, endpoint);
        svc.addHeader('Content-Type', 'application/json');

        svc.setRequestMethod('PUT');
        if (modelObject) {
            return modelObject;
        }
        return null;
    },
    parseResponse: parseResponse,
    mockCall: function () {
        var obj = {
        };
        return {
            statusCode: 202,
            statusMessage: 'Accepted',
            text: JSON.stringify(obj)
        };
    }
};

var queryDefinition = {
    /**
     * Query records
     *
     * @param {dw.svc.HTTPService} svc service
     * @param {string} endpoint endpoint
     * @param {string} query A query to be sent to Service Cloud
     *
     * @todo Support query builder: https://github.com/jsforce/jsforce/blob/master/lib/soql-builder.js
     */
    createRequest: function (svc, endpoint, query) {
        // eslint-disable-next-line no-param-reassign
        query = encodeURIComponent(query).replace(/%20/g, '+');

        setAuthHeader(svc, endpoint);
        svc.setURL(StringUtils.format('{0}query/?q={1}', svc.getURL(), query));
        svc.addHeader('Content-Type', 'application/json');
        svc.setRequestMethod('GET');
    },
    parseResponse: parseResponse,
    mockCall: function () {
        var obj = {
        };
        return {
            statusCode: 200,
            statusMessage: 'Success',
            text: JSON.stringify(obj)
        };
    }
};

var deleteDefinition = {
    /**
     * Delete record(s)
     *
     * @param {dw.svc.HTTPService} svc service
     * @param {string} endpoint endpoint
     * @param {string} id id
     */
    createRequest: function (svc, endpoint, id) {
        setAuthHeader(svc, endpoint);
        svc.setURL(StringUtils.format(svc.getURL(), id));
        svc.addHeader('Content-Type', 'application/json');
        svc.setRequestMethod('DELETE');
    },
    parseResponse: parseResponse,
    mockCall: function () {
        var obj = {
        };
        return {
            statusCode: 200,
            statusMessage: 'Success',
            text: JSON.stringify(obj)
        };
    }
};

var getDefinition = {
    /**
     * Get record(s)
     *
     * @param {dw.svc.HTTPService} svc service
     * @param {string} endpoint endpoint
     * @param {string} id id
     */
    createRequest: function (svc, endpoint, id) {
        setAuthHeader(svc, endpoint);
        svc.setURL(StringUtils.format(svc.getURL(), id));
        svc.addHeader('Content-Type', 'application/json');
        svc.setRequestMethod('GET');
    },
    parseResponse: parseResponse,
    mockCall: function () {
        var obj = {
        };
        return {
            statusCode: 200,
            statusMessage: 'Success',
            text: JSON.stringify(obj)
        };
    }
};

module.exports = {
    endpoints: endpoints,
    definitions: {
        create: createAndUpdateDefinition,
        update: createAndUpdateDefinition,
        query: queryDefinition,
        get: getDefinition,
        patch: patchDefinition,
        put: putDefinition,
        delete: deleteDefinition
    }
};
