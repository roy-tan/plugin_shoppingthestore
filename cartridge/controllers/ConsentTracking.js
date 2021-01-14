
'use strict';

var server = require('server');

server.extend(module.superModule);

server.replace('GetContent', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');

    var apiContent = ContentMgr.getContent(req.querystring.cid);

    if (apiContent) {
        var content = new ContentModel(apiContent, 'components/content/contentAssetInc');
        if (content.template) {
            res.render('common/consentModal', { content: content });
        }
    }
    next();
});

module.exports = server.exports();

