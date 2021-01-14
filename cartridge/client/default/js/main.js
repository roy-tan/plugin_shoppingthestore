window.$ = require('jquery');

window.jQuery = window.$;
const processInclude = require('base/util');

$(document).ready(() => {
    processInclude(require('./components/menu'));
    processInclude(require('base/components/cookie'));
    processInclude(require('./components/consentTracking'));
    processInclude(require('base/components/footer'));
    processInclude(require('base/components/miniCart'));
    processInclude(require('base/components/collapsibleItem'));
    processInclude(require('base/components/search'));
    processInclude(require('base/components/clientSideValidation'));
    processInclude(require('base/components/countrySelector'));
    processInclude(require('./storeLocator/selectStoreModal'));
    processInclude(require('./storeLocator/storePopup'));
});

require('base/thirdParty/bootstrap');
require('./components/spinner');
