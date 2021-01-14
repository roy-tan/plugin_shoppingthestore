
'use strict';

var server = require('server');

server.extend(module.superModule);

var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');

server.append('Login', function (req, res, next) {
    storeHelpers.updatePreferredStoreIdWithProfile();
    next();
});

server.append('Show', function (req, res, next) {
    var registrationStatus = req.querystring.registration;
    if (registrationStatus === 'submitted') {
        storeHelpers.updatePreferredStoreIdWithProfile();
    }
    next();
});

server.get('TwoLineHeader', server.middleware.include, function (req, res, next) {
    var template = req.querystring.mobile ? 'account/mobileHeader' : 'account/twolineheader';
    res.render(template, {
        name:
        req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null
    });
    next();
});

module.exports = server.exports();
