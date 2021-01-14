'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');

/**
 * Render logic for the assets.headlinebanner.
 * @param {*} context - context
 * @return {*} the rendered template
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;

    var storeId = 'chstore1';
    if (request.httpParameters.params && request.httpParameters.params.length > 0) {
        var params = JSON.parse(request.httpParameters.params[0]);
        var queryString = '{"' + JSON.parse(params.custom).queryString.replace('=', '":"').replace('&', '","') + '"}';
        storeId = JSON.parse(queryString).storeId;
    }
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var store = storeHelpers.getStore(storeId);
    if (store.image) {
        model.image = {
            src: {
                mobile: ImageTransformation.url(store.image, { device: 'mobile' }),
                tablet: ImageTransformation.url(store.image, { device: 'tablet' }),
                desktop: ImageTransformation.url(store.image, { device: 'desktop' })
            },
            alt: store.name,
            title: store.name,
            focalPointX: (content.storeimage.focalPoint.x * 100) + '%',
            focalPointY: (content.storeimage.focalPoint.y * 100) + '%'
        };
    } else if (content.storeimage) {
        model.image = {
            src: {
                mobile: ImageTransformation.url(content.storeimage, { device: 'mobile' }),
                tablet: ImageTransformation.url(content.storeimage, { device: 'tablet' }),
                desktop: ImageTransformation.url(content.storeimage, { device: 'desktop' })
            },
            alt: content.alttext,
            focalPointX: (content.storeimage.focalPoint.x * 100) + '%',
            focalPointY: (content.storeimage.focalPoint.y * 100) + '%'
        };
    }

    return new Template('experience/components/assets/storeprofileImage').render(model).text;
};
