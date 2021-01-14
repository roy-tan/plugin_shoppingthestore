'use strict';

var PREFERENCE_NO_STORE = 'No Store';
var EARTH_CIRCUMFERENCE = 40000;
var MAX_NB_STORE_RESULTS = 10;

var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var HashMap = require('dw/util/HashMap');
var Site = require('dw/system/Site');
var Calendar = require('dw/util/Calendar');
var ServiceMgr = require('*/cartridge/scripts/ServiceMgr');
var StoreMgr = require('dw/catalog/StoreMgr');
var StringUtils = require('dw/util/StringUtils');
var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

/**
 * getPreferredStoreId
 * checks with session if a store is seleced and returns it
 * @returns {string} preferredStoreId
 * */
function getPreferredStoreId() {
    // eslint-disable-next-line no-undef
    return session.custom.preferredStoreId;
}

/**
 * readReservedSlotFromSession
 * @return {string} reserved slot in string format
 */
function readReservedSlotFromSession() {
    // eslint-disable-next-line no-undef
    return session.custom.reservedSlot;
}

/**
 * writeReservedSlotToSession
 * @param {string} reservedSlot reserved slot in string format
 */
function writeReservedSlotToSession(reservedSlot) {
    // eslint-disable-next-line no-undef
    session.custom.reservedSlot = reservedSlot;
}

/**
 * readReservedSlotFromBasket
 * @return {string} reserved slot in string format
 */
function readReservedSlotFromBasket() {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket != null) {
        return currentBasket.custom.reservedDeliverySlot;
    }

    return null;
}

/**
 * saveReservedSlotToBasket
 */
function saveReservedSlotToBasket() {
    Transaction.wrap(function () {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var slotInfo = readReservedSlotFromSession();
        if (slotInfo && slotInfo !== 'null') {
            currentBasket.custom.reservedDeliverySlot = slotInfo;
            var slotData = JSON.parse(slotInfo);
            var reservationData = JSON.parse(slotData.reservation);
            currentBasket.custom.facilityId = reservationData.facilityId;
            currentBasket.custom.reservationId = reservationData.reservationId;
            currentBasket.custom.slotId = slotData.slotID;
            currentBasket.custom.isScheduledOrder = true;
            currentBasket.custom.orderStoreId = getPreferredStoreId();

            var startDate = new Date();
            var endDate = new Date();
            var splitDateTime = reservationData.startDateTime.toString().split('T')[0];
            var splitDate = splitDateTime.split('-');
            startDate.setFullYear(splitDate[0], parseInt(splitDate[1], 10) - 1, splitDate[2]);
            splitDateTime = reservationData.startDateTime.toString().split('T')[1];
            var splitTime = splitDateTime.split(':');
            startDate.setHours(splitTime[0]);
            startDate.setMinutes(splitTime[1]);
            splitDate = reservationData.endDateTime.toString().split('T')[0].split('-');
            endDate.setFullYear(splitDate[0], parseInt(splitDate[1], 10) - 1, splitDate[2]);
            splitTime = reservationData.endDateTime.toString().split('T')[1].split(':');
            endDate.setHours(splitTime[0]);
            endDate.setMinutes(splitTime[1]);

            currentBasket.custom.scheduledStartTime = startDate;
            currentBasket.custom.scheduledEndTime = endDate;
        }
    });
}

/**
 * getTomorrowIfaplicable
 * @param {dw.util.Calendar} date - date to be determined if tomorrow
 * @returns {string} tomorrow if aplicable, '' else
 */
function getTomorrowIfaplicable(date) {
    var referenceDate = new Calendar(new Date());

    if (referenceDate.isSameDay(date)) {
        return Resource.msg('label.today', 'shoppingthestore', 'Today') + ' ';
    }
    referenceDate.add(Calendar.HOUR, 24);
    if (referenceDate.isSameDay(date)) {
        return Resource.msg('label.tomorrow', 'shoppingthestore', 'Tomorrow') + ' ';
    }

    return '';
}

/**
 * setReservedSlot
 * save slot information in session
 * @param {*} slot - slot json object
 */
function setReservedSlot(slot) {
    var slotAsString = null;
    try {
        slotAsString = JSON.stringify(slot);
    } catch (e) {
        var Logger = require('dw/system/Logger');
        Logger.error('Could not stringify slot. likely null');
        slotAsString = null;
    }
    writeReservedSlotToSession(slotAsString);

    saveReservedSlotToBasket();
}

/**
 * clearReservedSlotFromSession
 * save slot information in session
 * @param {*} slot - slot json object
 */
function clearReservedSlotFromSession() {
    writeReservedSlotToSession(null);
}

/**
 * getReservedSlot
 * return slot json object from session
 * @returns {Object} json object containing slot information
 */
function getReservedSlot() {
    // eslint-disable-next-line no-undef
    var slotData = readReservedSlotFromSession();
    if (!slotData) {
        slotData = readReservedSlotFromBasket();
    }
    if (slotData) {
        var slot = JSON.parse(slotData);
        if (slot) {
            var now = new Calendar(new Date());
            var expiry = new Calendar(new Date());
            if (slot.expiry) {
                expiry.parseByFormat(slot.expiry, ServiceMgr.DATE_FORMAT);
            }

            if (now.compareTo(expiry) < 0) {
                var diff = new Date(expiry.getTime() - now.getTime());
                if (diff.getHours() === 0) {
                    slot.expiryTime = diff.getMinutes() + ' ' + Resource.msg('format.slotRemainingMinutes', 'shoppingthestore', 'minutes');
                } else {
                    slot.expiryTime = ('0' + diff.getHours()).slice(-2) + ':' + ('0' + diff.getMinutes()).slice(-2);
                }
            } else {
                slot.expiryTime = null;
            }
        }
        return slot;
    }

    return null;
}

/**
 * isStoreSelected
 *  checks with session if a store is seleced and returns true if so
 * @returns {boolean} true if a store is selected
 * */
function isStoreSelected() {
    // eslint-disable-next-line no-undef
    return session.custom.preferredStoreId != null;
}

/**
 * savePreferredStoreIdToProfile
 */
function savePreferredStoreIdToProfile() {
    Transaction.wrap(function () {
        // eslint-disable-next-line no-undef
        customer.profile.custom.preferredStoreId = getPreferredStoreId();
    });
}

/**
 * @param {integer} days - number of days from today included
 * @param {string} formatKey - format key
 * @param {string} format0 - format zero
 * @param {string} format1 - format one
 * @param {string} format2 - format tow
 * @return {[]} array of formated dates
 */
function getFormattedDays(days, formatKey, format0, format1, format2) {
    var result = [];

    for (var i = 0; i < days; i += 1) {
        var cal = new Calendar(new Date());
        cal.add(Calendar.HOUR, 24 * i);

        var formattedDay = {
            format0: StringUtils.formatCalendar(cal, format0),
            format1: StringUtils.formatCalendar(cal, format1),
            format2: StringUtils.formatCalendar(cal, format2),
            datekey: StringUtils.formatCalendar(cal, formatKey)
        };
        result.push(formattedDay);
    }

    return result;
}

/**
 * Set the pricebook of the preferred store as applicable pricebook
 */
function setApplicablePricebook() {
    /* Set Store's Price Book */
    var store = StoreMgr.getStore(getPreferredStoreId());
    var priceBookID = store.custom.pricebookID;

    var PriceBookMgr = require('dw/catalog/PriceBookMgr');
    var priceBook = PriceBookMgr.getPriceBook(priceBookID);
    if (priceBook) {
        PriceBookMgr.setApplicablePriceBooks(priceBook);

        var priceBookCurrencyCode = priceBook.currencyCode;
        var sessionCurrencyCode = session.getCurrency().getCurrencyCode();

        if (sessionCurrencyCode !== priceBookCurrencyCode) {
            var Currency = require('dw/util/Currency');
            var pricebookCurrency = Currency.getCurrency(priceBookCurrencyCode);
            session.setCurrency(pricebookCurrency);

            var BasketMgr = require('dw/order/BasketMgr');
            var currentBasket = BasketMgr.getCurrentBasket();
            if (currentBasket && pricebookCurrency && currentBasket.currencyCode !== pricebookCurrency.currencyCode) {
                Transaction.wrap(function () {
                    currentBasket.updateCurrency();
                });
            }
        }
    }
}

/**
 * setPreferredStoreId
 * 1) Save store Id to cookie
 * 2) Save store Id in sesstion
 * 3) Save store Id in profile
 * 4) Release reserev slots of the old store
 * 5) Switch price book
 *
 * @param {string} preferredStoreId - store id to be set
 */
function setPreferredStoreId(preferredStoreId) {
    /* Save Store ID to Cookie */
    // eslint-disable-next-line no-undef
    if (!request.httpCookies.preferredStoreId || request.httpCookies.preferredStoreId.value !== preferredStoreId) {
        var Cookie = require('dw/web/Cookie');
        var selectedStoreCookie = new Cookie('preferredStoreId', preferredStoreId);
        selectedStoreCookie.setPath('/');
        // eslint-disable-next-line no-undef
        response.addHttpCookie(selectedStoreCookie);
    }
    // only set anything in case the store is not the same as current one, prevents deletion of reserved slot
    if (session.custom.preferredStoreId !== preferredStoreId) {
        // eslint-disable-next-line no-undef
        session.custom.preferredStoreId = preferredStoreId;

        /* Save preferred store id in profile */
        // eslint-disable-next-line no-undef
        if (customer.authenticated) {
            savePreferredStoreIdToProfile();
        }

        /* If we currently have a slot, with the old store, we release it */
        if (getReservedSlot()) {
            clearReservedSlotFromSession(null);
        }

        // Once changing promotions we need to clean promotion cache
        session.privacy.promoCache = null;

        setApplicablePricebook();
    }
}

/**
 * calculate the distance between two coordinates
 * @param {double} lat1 - latitude position one
 * @param {double} lon1 - longitude position one
 * @param {double} lat2 - latitude position two
 * @param {double} lon2 - longitude position two
 * @param {string} distanceUnit - distance unit km or mi
 * @returns {string} The rendered HTML
 */
function measure(lat1, lon1, lat2, lon2, distanceUnit) { // generally used geo measurement function
    var R = 6378.137; // Radius of earth in KM
    var dLat = ((lat2 * Math.PI) / 180) - ((lat1 * Math.PI) / 180);
    var dLon = ((lon2 * Math.PI) / 180) - ((lon1 * Math.PI) / 180);
    var a = (Math.sin(dLat / 2) * Math.sin(dLat / 2)) +
                (Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2));
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;// kilometers
    if (distanceUnit === 'mi') {
        d /= 1.609344;
    }
    if (d < 100) {
        /* short distance so round two digits */
        d = (Math.round(d * 100)) / 100;
    } else {
        d = Math.round(d);
    }

    return d + ' ';
}

/**
 * create the stores availability Model
 * @param {Object} apiProduct - apiProduct
 * @param {string} storeId The store ID to be checked or null to check preferred store
 * @returns {string} The availability Model
 */
function getStoreAvailabilityModel(apiProduct, storeId) {
    if (storeId) {
        var store = StoreMgr.getStore(storeId);
        if (store && store.inventoryList) {
            return apiProduct.getAvailabilityModel(store.inventoryList);
        }
    }
    return apiProduct.availabilityModel;
}

/**
 * create the stores results html
 * @param {Array} storesInfo - an array of objects that contains store information
 * @param {boolean} showMap - flag if a map should be shown
 * @returns {string} The rendered HTML
 */
function createStoresResultsHtml(storesInfo, showMap) {
    var Template = require('dw/util/Template');

    var context = new HashMap();
    var object = {
        showMap: showMap,
        stores: { stores: storesInfo }
    };

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    var template = new Template('storeLocator/storeLocatorResults');
    return template.render(context).text;
}

/**
 * Searches for stores and creates a plain object of the stores returned by the search
 * @param {string} radius - selected radius
 * @param {string} postalCode - postal code for search
 * @param {string} lat - latitude for search by latitude
 * @param {string} long - longitude for search by longitude
 * @param {Object} geolocation - geloaction object with latitude and longitude
 * @param {boolean} showMap - boolean to show map
 * @param {dw.web.URL} url - a relative url
 * @returns {Object} a plain object containing the results of the search
 */
function getStores(radius, postalCode, lat, long, geolocation, showMap, url) {
    var StoresModel = require('*/cartridge/models/stores');
    var URLUtils = require('dw/web/URLUtils');
    var countryCode = geolocation.countryCode;
    var distanceUnit = countryCode === 'US' ? 'mi' : 'km';
    var actionUrl = url || URLUtils.url('Stores-Find', 'update', true, 'showMap', showMap).toString();
    var apiKey = Site.getCurrent().getCustomPreferenceValue('mapAPI');

    // eslint-disable-next-line no-restricted-globals
    var resolvedRadius = (!isNaN(radius)) ? parseInt(radius, 10) : EARTH_CIRCUMFERENCE;
    if (resolvedRadius < 0) {
        resolvedRadius = EARTH_CIRCUMFERENCE;
    }

    var extendedStores = [];
    var searchKey = {};
    var storeMgrResult = null;
    var storeMap = null;
    var store = null;
    var location = {
        lat: (lat && long && lat !== 'undefined') ? parseFloat(lat) : geolocation.latitude,
        long: (long && lat && lat !== 'undefined') ? parseFloat(long) : geolocation.longitude
    };

    if (postalCode && postalCode !== '') {
        var queryString = 'city ILIKE {0} or stateCode ILIKE {0} or postalCode ILIKE {0}';
        storeMgrResult = StoreMgr.searchStoresByCoordinates(location.lat, location.long, distanceUnit, resolvedRadius, queryString, postalCode);
        searchKey = { postalCode: postalCode };
    } else {
        // find by coordinates (detect location)
        storeMgrResult = StoreMgr.searchStoresByCoordinates(location.lat, location.long, distanceUnit, resolvedRadius);
        searchKey = { lat: location.lat, long: location.long };
    }

    /* To achieve fuzzy search, we also search for Store Profile Pages */
    if (storeMgrResult.length === 0 && postalCode && postalCode !== '') {
        var query = {
            q: postalCode,
            folder: 'stores-content'
        };
        var contentSearch = searchHelper.setupContentSearch(query);

        contentSearch.contents.forEach(function (storeContent) {
            store = StoreMgr.getStore(storeContent.id);

            storeMap = new HashMap();
            Object.keys(store).forEach(function (k) {
                storeMap.put(k, store[k]);
            });
            storeMap.distanceValue = measure(location.lat, location.long, store.latitude, store.longitude, distanceUnit);
            storeMap.distance = storeMap.distanceValue + distanceUnit;

            if (storeMap.distanceValue <= resolvedRadius) {
                extendedStores.push(storeMap);
            }
        });
        extendedStores.sort(function (a, b) { return a.distanceValue - b.distanceValue; });
    } else {
        /* extend stores with distance to current position */
        var stores = storeMgrResult.keySet();

        Object.keys(stores).forEach(function (key) {
            store = stores[key];
            storeMap = new HashMap();
            Object.keys(store).forEach(function (k) {
                storeMap.put(k, store[k]);
            });
            storeMap.distance = measure(location.lat, location.long, storeMap.latitude, storeMap.longitude, distanceUnit) + distanceUnit;

            extendedStores.push(storeMap);
        });
    }
    if (extendedStores.length > MAX_NB_STORE_RESULTS) {
        extendedStores = extendedStores.slice(0, MAX_NB_STORE_RESULTS);
    }

    return new StoresModel(extendedStores, searchKey, resolvedRadius, actionUrl, apiKey, showMap);
}

/**
 * gets a store from store manager and returns it
 * @param {string} storeId - searched store id
 * @returns {Object} a plain object containing the results of the search
 */
function getStore(storeId) {
    return StoreMgr.getStore(storeId);
}

/**
 * updatePreferredStoreIdWithProfile
 * Case A: User selected Store already --> Save it in Profile
 * Case B: No Store Selected yet --> Get it from Profile
  * @param {*} customer customer object
  * @param {*} session session object
  */
function updatePreferredStoreIdWithProfile() {
    // eslint-disable-next-line no-undef
    if (customer.authenticated) {
        if (isStoreSelected()) {
            savePreferredStoreIdToProfile();
        // eslint-disable-next-line no-undef
        } else if (customer.profile.custom && customer.profile.custom.preferredStoreId) {
            // eslint-disable-next-line no-undef
            setPreferredStoreId(customer.profile.custom.preferredStoreId);
        }

        if (readReservedSlotFromSession() != null) {
            saveReservedSlotToBasket();
        // eslint-disable-next-line no-undef
        } else {
            var BasketMgr = require('dw/order/BasketMgr');
            var currentBasket = BasketMgr.getCurrentOrNewBasket();
            var slot = currentBasket.custom.reservedDeliverySlot;
            if (slot) {
                writeReservedSlotToSession(slot);
            }
        }
    }
}

/**
 * setNoStorePreference
 * save in cookie that no store is to be chosen
 * */
function setNoStorePreference() {
    var Cookie = require('dw/web/Cookie');
    var selectedStoreCookie = new Cookie('storePreference', PREFERENCE_NO_STORE);
    selectedStoreCookie.setPath('/');
    // eslint-disable-next-line no-undef
    response.addHttpCookie(selectedStoreCookie);
}

/**
 * showStoreSelectorModal
 * check if the store selector is to be shown
 * @param {*} storePreferenceCookie  - cookie containing storePreferenceInformation
 * @return {boolean} true if the modal window is to be shown
 */
function showStoreSelectorModal(storePreferenceCookie) {
    // eslint-disable-next-line no-undef
    return !isStoreSelected() && (empty(storePreferenceCookie) || (storePreferenceCookie.value !== PREFERENCE_NO_STORE));
}

/**
 * get available slots for this store from web service
  * @param {*} storeId - store Id the slot it to be received for
  * @param {*} days - number of days from now slots are to be received for
  * @returns {Object} Json object containint the slots
  */
function getSlotPicker(storeId, days) {
    var Logger = require('dw/system/Logger');
    var apidays = null;
    var firstAvailableSlot = null;
    var svc = ServiceMgr.restUpdate();

    /* Calculate Start and End date */
    var currentDate = new Calendar(new Date());
    var endDate = new Calendar(new Date());
    endDate.add(Calendar.HOUR, 24 * days);

    /* Get store ID */
    var store = StoreMgr.getStore(storeId);
    var facilityID = store.custom.facilityId;

    if (facilityID) {
        var payload = {
            facilityUuid: facilityID,
            startDateTime: StringUtils.formatCalendar(currentDate, ServiceMgr.DATE_FORMAT),
            endDateTime: StringUtils.formatCalendar(endDate, ServiceMgr.DATE_FORMAT)
        };
        var result = svc.call(ServiceMgr.restEndpoints.slotReservation.search, JSON.stringify(payload));

        /* Create Array with date key and startTime, endTime and capacity as Content */
        if (result.ok || result.mockResult === true) {
            var slots = result.object.responseObj;
            if (slots.length > 0) {
                apidays = {};

                firstAvailableSlot = slots[0];
                var formatDateKey = Resource.msg('format.dateKey', 'shoppingthestore', 'yyyy-MM-dd');
                var cal = new Calendar(new Date());
                cal.parseByFormat(firstAvailableSlot.startDateTime, ServiceMgr.DATE_FORMAT);
                firstAvailableSlot.dateKey = StringUtils.formatCalendar(cal, formatDateKey);

                slots.forEach(function (slot) {
                    var dateTimeString = slot.startDateTime;
                    var dateString = dateTimeString.substring(0, 10);
                    var startTimeString = dateTimeString.substring(11, 16);

                    dateTimeString = slot.endDateTime;
                    dateString = dateTimeString.substring(0, 10);
                    var endTimeString = dateTimeString.substring(11, 16);

                    var slotData = {
                        startTime: startTimeString,
                        endTime: endTimeString,
                        capacity: slot.availableSlots,
                        slotID: slot.uuid
                    };

                    if (slot.status !== 'AVAILABLE') {
                        slotData.capacity = 0;
                    }

                    if (!apidays[dateString]) {
                        apidays[dateString] = [slotData];
                    } else {
                        apidays[dateString].push(slotData);
                    }
                });

                var keys = Object.keys(apidays);
                keys.forEach(function (key) {
                    var slotlist = apidays[key];
                    // slotlist.sort(function (a, b) { return a.startTime < b.startTime ? -1 : +1; });
                    /* remove empty slots before first non empty slot */
                    for (var i = 0; i < slotlist.length; i += 1) {
                        if (slotlist[0].capacity === 0) {
                            slotlist.shift();
                        } else break;
                    }
                });
            }
        }
    } else {
        Logger.error('Store {0} does not have a facilty created, it needs to be setup', storeId);
    }

    var response = {
        apidays: apidays,
        firstAvailableSlot: firstAvailableSlot
    };

    return response;
}

/**
 * @param {string} storeId - id of the store the slots are to be received for
 * @return {HashMap} viewData - view data to render slots
 */
function getSlotData(storeId) {
    var days = Site.getCurrent().getCustomPreferenceValue('availableSlotDays');

    var formatDateKey = Resource.msg('format.dateKey', 'shoppingthestore', 'yyyy-MM-dd');
    var formatDateHeader = Resource.msg('format.dateHeader', 'shoppingthestore', 'MMMM d');
    var formatWeekday = Resource.msg('format.weekday', 'shoppingthestore', 'E');
    var formatPickerDate = Resource.msg('format.pickerDate', 'shoppingthestore', 'MMM d');
    var formattedDays = getFormattedDays(days, formatDateKey, formatDateHeader, formatWeekday, formatPickerDate);

    var slotPickerResults = getSlotPicker(storeId, days);
    var viewData = {
        preferredStoreId: storeId,
        reservedSlot: getReservedSlot(),
        maxDays: days,
        formattedDays: JSON.stringify(formattedDays),
        slots: slotPickerResults ? slotPickerResults.apidays : null,
        firstAvailableSlotDate: slotPickerResults.firstAvailableSlot ? slotPickerResults.firstAvailableSlot.dayKey : null
    };

    return viewData;
}

/**
 * @param {string} isCancel - id of the store the slots are to be received for
 * @param {string} reservationId - reservationId of the reservation
 * @return {HashMap} result - result of slot reservation api
 */
function reserveOrCancelReservation(isCancel, reservationId) {
    var svc = ServiceMgr.restUpdate();
    var payload = '{}';
    var result;
    if (isCancel) {
        result = svc.call((ServiceMgr.restEndpoints.slotReservation.reserveSlotConfirm).replace('{0}', reservationId + '?cancelreq=true'), payload);
    } else {
        var softReservation = getReservedSlot();
        if (softReservation != null) {
            var reservationData = JSON.parse(softReservation.reservation);
            payload = '{ "reservationId": "' + reservationData.reservationId + '", "externalId": "' + reservationData.externalId + '", "facilityId": "' + reservationData.facilityId + '", "resourceId": "' + reservationData.resourceId + '", "startDateTime": "' + reservationData.startDateTime + '", "endDateTime": "' + reservationData.endDateTime + '", "slotId": "' + softReservation.slotID + '", "source": "CC", "status": "DRAFT" }';
            result = svc.call((ServiceMgr.restEndpoints.slotReservation.reserveSlotConfirm).replace('{0}', reservationData.reservationId), payload);
        }
    }
    return result;
}

module.exports = {
    clearReservedSlotFromSession: clearReservedSlotFromSession,
    setPreferredStoreId: setPreferredStoreId,
    updatePreferredStoreIdWithProfile: updatePreferredStoreIdWithProfile,
    getPreferredStoreId: getPreferredStoreId,
    isStoreSelected: isStoreSelected,
    setNoStorePreference: setNoStorePreference,
    showStoreSelectorModal: showStoreSelectorModal,
    setReservedSlot: setReservedSlot,
    getReservedSlot: getReservedSlot,
    getSlotPicker: getSlotPicker,
    getStoreAvailabilityModel: getStoreAvailabilityModel,
    createStoresResultsHtml: createStoresResultsHtml,
    getStores: getStores,
    getStore: getStore,
    reserveOrCancelReservation: reserveOrCancelReservation,
    setApplicablePricebook: setApplicablePricebook,
    getFormattedDays: getFormattedDays,
    getTomorrowIfaplicable: getTomorrowIfaplicable,
    getSlotData: getSlotData,
    EARTH_CIRCUMFERENCE: EARTH_CIRCUMFERENCE
};

