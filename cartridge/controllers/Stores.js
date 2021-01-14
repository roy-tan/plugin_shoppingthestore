'use strict';

var server = require('server');

var URLUtils = require('dw/web/URLUtils');
var ServiceMgr = require('../scripts/ServiceMgr');
var Resource = require('dw/web/Resource');
var Template = require('dw/util/Template');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');

server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
var HashMap = require('dw/util/HashMap');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
 * Draw google maps with finder form and result list
 * Compared to bas version we have an additional viewData variable for preferredStoreId
 */
server.replace('Find', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var update = req.querystring.update;
    var preferredStoreId = req.querystring.storeId;
    var radius = req.querystring.radius;
    if (!radius)radius = '30';
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var radiusExtended = false;

    var extendRadiusWhenSearchEmpty = req.querystring.extendRadiusWhenSearchEmpty !== 'false';
    var stores = storeHelpers.getStores(radius, postalCode, lat, long, req.geolocation, showMap);
    if (extendRadiusWhenSearchEmpty && stores.stores.length === 0) {
        stores = storeHelpers.getStores(100, postalCode, lat, long, req.geolocation, showMap);
        radiusExtended = true;
    }
    if (extendRadiusWhenSearchEmpty && stores.stores.length === 0) {
        stores = storeHelpers.getStores(300, postalCode, lat, long, req.geolocation, showMap);
    }
    if (extendRadiusWhenSearchEmpty && stores.stores.length === 0) {
        stores = storeHelpers.getStores(-1, postalCode, lat, long, req.geolocation, showMap);
    }

    if (update) {
        stores.radiusExtended = radiusExtended;

        res.json(stores);
    } else {
        var viewData = {};
        if (preferredStoreId) {
            viewData = storeHelpers.getSlotData(preferredStoreId);
            var store = storeHelpers.getStore(preferredStoreId);
            viewData.store = store;
        }

        viewData.radius = stores.radius;
        viewData.stores = stores;
        viewData.showMap = showMap;
        viewData.radiusExtended = radiusExtended;

        res.render('storeLocator/storeLocator', viewData);
    }

    next();
});

/**
 * Sets the preference for not store
 */
server.get('noStore', function (req, res, next) {
    storeHelpers.setNoStorePreference();
    res.render('storeLocator/dialogs/selectStoreModal');
    next();
});

/**
 * GetSlotPicker
 */
server.get('GetSlotPicker', function (req, res, next) {
    var preferredStoreId = storeHelpers.getPreferredStoreId();
    var viewData = storeHelpers.getSlotData(preferredStoreId);

    res.render('storeLocator/slotPicker', viewData);
    next();
});

/**
 * SelectStore
 * 1) Set new preferred store id
 * 2) get available slots for this store from web service
 */
server.get('SelectStore', server.middleware.https, function (req, res, next) {
    var preferredStoreId = req.querystring.id;

    /* Set preferred slot */
    storeHelpers.setPreferredStoreId(preferredStoreId);

    res.redirect(URLUtils.https('Stores-GetSlotPicker'));
    next();
});

/**
 * SoftReserve
 * Soft reserve slot by web service
 */
server.get('SoftReserve', function (req, res, next) {
    var preferredStoreId = req.querystring.id;
    var slotID = req.querystring.slotID;
    var showButtons = req.querystring.showButtons;

    /* cancel previous reservation */
    var reservedSlot = storeHelpers.getReservedSlot();
    if (reservedSlot) {
        storeHelpers.reserveOrCancelReservation(true, JSON.parse(reservedSlot.reservation).reservationId);
    }

    var svc = ServiceMgr.restUpdate();
    var payload = {
        externalId: new Date().toISOString(),
        slotId: slotID,
        source: 'CC'
    };
    payload = JSON.stringify(payload);
    var result = svc.call(ServiceMgr.restEndpoints.slotReservation.reserveSlotSoft, payload);

    if (result.ok || result.mockResult === true) {
        var cal = new Calendar(new Date());
        cal.parseByFormat(result.object.responseObj.startDateTime, ServiceMgr.DATE_FORMAT);
        var formatPickerSlotDate = Resource.msg('format.slotDate', 'shoppingthestore', 'MMM d');
        var formatSlotTime = Resource.msg('format.slotTime', 'shoppingthestore', 'h:mm a');
        var slotFormattedDate = StringUtils.formatCalendar(cal, formatPickerSlotDate);
        var slotStartTime = StringUtils.formatCalendar(cal, formatSlotTime);
        var tomorrow = storeHelpers.getTomorrowIfaplicable(cal);
        var formatDateKey = Resource.msg('format.dateKey', 'shoppingthestore', 'yyyy-MM-dd');
        var dayKey = StringUtils.formatCalendar(cal, formatDateKey);
        var formatTimeKey = Resource.msg('format.timeKey', 'shoppingthestore', 'hh:mm');
        var timeKey = StringUtils.formatCalendar(cal, formatTimeKey);

        cal.parseByFormat(result.object.responseObj.endDateTime, ServiceMgr.DATE_FORMAT);
        var slotEndTime = StringUtils.formatCalendar(cal, formatSlotTime);

        var slot = {
            storeId: preferredStoreId,
            date: dayKey,
            time: timeKey,
            dateFormatted: tomorrow + slotFormattedDate,
            timeFormatted: slotStartTime + ' - ' + slotEndTime,
            slotID: slotID,
            reservation: JSON.stringify(result.object.responseObj),
            expiry: result.object.responseObj.reservationExpiry
        };
        storeHelpers.setReservedSlot(slot);

        res.redirect(URLUtils.https('Stores-CurrentStore', 'noPopup', true, 'hideButtons', !showButtons));
    }
    next();
});

server.get('StoreAddress', cache.applyDefaultCache, function (req, res, next) {
    var preferredStoreId = req.querystring.storeId;

    var store = null;
    if (preferredStoreId) {
        store = storeHelpers.getStore(preferredStoreId);
    }

    var viewData = {
        store: store
    };

    res.render('storeLocator/decorators/storeAddressWrapper', viewData);
    next();
});

/**
 * SelectedStoreHeader
 * Show name of the store if it is selected
 */
server.get('SelectedStoreHeader', cache.applyDefaultCache, function (req, res, next) {
    var preferredStoreId = req.querystring.storeId;

    var store = null;
    if (preferredStoreId) {
        store = storeHelpers.getStore(preferredStoreId);
    }

    var viewData = {
        preferredStoreId: preferredStoreId,
        store: store
    };

    res.render('storeLocator/decorators/selectedStoreHeader', viewData);
    next();
});

/**
 * currentStore
 * give info window for popup about selected store
 */
server.get('CurrentStore', function (req, res, next) {
    var noPopup = req.querystring.noPopup;
    var showButtons = !req.querystring.hideButtons;
    var preferredStoreId = null;
    var showStoreSelectorModal = false;
    var template = 'components/header/store';
    if (noPopup) {
        template = 'storeLocator/selectedStoreInfo';
    }

    if (!storeHelpers.isStoreSelected()) {
        // eslint-disable-next-line no-undef
        if (request.httpCookies.preferredStoreId) {
            // eslint-disable-next-line no-undef
            storeHelpers.setPreferredStoreId(request.httpCookies.preferredStoreId.value);
        } else {
            // eslint-disable-next-line no-undef
            showStoreSelectorModal = storeHelpers.showStoreSelectorModal(request.httpCookies.storePreference);
        }
    } else {
        preferredStoreId = storeHelpers.getPreferredStoreId();
    }

    var reservedSlot = storeHelpers.getReservedSlot();
    var viewData = {
        reservedSlot: reservedSlot,
        preferredStoreId: preferredStoreId,
        showStoreSelectorModal: showStoreSelectorModal,
        hideButtons: !showButtons
    };

    res.render(template, viewData);
    next();
});

server.get('GetNextAvailableSlot', cache.applyVeryShortCache, function (req, res, next) {
    var preferredStoreId = req.querystring.storeid;
    var viewData = {};

    /* Get Next available Slot from API */
    var days = Site.getCurrent().getCustomPreferenceValue('availableSlotDays');
    var nextSlot = storeHelpers.getSlotPicker(preferredStoreId, days).firstAvailableSlot;
    if (nextSlot) {
        /* format dates */
        var firstAvailableSlotStart = nextSlot.startDateTime;
        var firstAvailableSlotEnd = nextSlot.endDateTime;

        var cal = new Calendar(new Date());
        var formatPickerSlotDate = Resource.msg('format.slotDate', 'shoppingthestore', 'MMM d');
        var formatSlotTime = Resource.msg('format.slotTime', 'shoppingthestore', 'h:mm a');

        cal.parseByFormat(firstAvailableSlotStart, ServiceMgr.DATE_FORMAT);
        var tomorrow = storeHelpers.getTomorrowIfaplicable(cal);
        var nextSlotDateKey = nextSlot.dateKey;
        var nextSlotFormattedDate = StringUtils.formatCalendar(cal, formatPickerSlotDate);
        var nextSlotStartTime = StringUtils.formatCalendar(cal, formatSlotTime);

        cal.parseByFormat(firstAvailableSlotEnd, ServiceMgr.DATE_FORMAT);
        var nextSlotEndTime = StringUtils.formatCalendar(cal, formatSlotTime);

        viewData = {
            dateKey: nextSlotDateKey,
            nextSlotDate: nextSlotFormattedDate,
            nextSlotStartTime: nextSlotStartTime,
            nextSlotEndTime: nextSlotEndTime,
            tomorrow: tomorrow
        };
    }

    res.render('/storeLocator/decorators/nextAvailableSlot', viewData);
    next();
});

/**
 * GetSelectStoreModal
 */
server.get('GetSelectStoreModal', cache.applyDefaultCache, function (req, res, next) {
    var selectStoreModalTemplate = new Template('storeLocator/dialogs/selectStoreModal');
    var selectStoreModal = selectStoreModalTemplate.render().text;
    var data = {
        selectStoreModal: selectStoreModal
    };

    res.json(data);
    next();
});

/**
 * GetStoreProfilePage
 */
server.get('GetStoreProfilePage', function (req, res, next) {
    var storeId = req.querystring.storeId;
    var reservedSlot = storeHelpers.getReservedSlot();
    var store = storeHelpers.getStore(storeId);

    var object = {
        store: store,
        reservedSlot: reservedSlot
    };

    var context = new HashMap();
    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    var template = new Template('storeLocator/storeProfilePage');
    var selectedStoreInfo = template.render(context).text;
    var data = {
        selectedStoreInfo: selectedStoreInfo
    };

    res.json(data);
    next();
});

/**
 * GetStoreProfilePagePD
 */
server.get('GetStoreProfilePagePD', cache.applyDefaultCache, function (req, res, next) {
    var storeId = req.querystring.storeId;
    var store = storeHelpers.getStore(storeId);
    var template = store.custom.pageDesignerId;
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var page = null;

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);

    var PageMgr = require('dw/experience/PageMgr');
    if (template != null) {
        page = PageMgr.getPage(template);
    }

    if (page && page.isVisible()) {
        var params = {
        };
        if (req.querystring.view && req.querystring.view === 'ajax') {
            params.decorator = 'common/layout/ajax';
        }
        res.page(page.ID, JSON.stringify(params));
    }

    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
