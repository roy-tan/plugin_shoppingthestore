'use strict';

var URLUtils = require('dw/web/URLUtils');

/**
 * @constructor
 * @classdesc ContentSuggestions class
 *
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of content items to retrieve
 */
function ContentSuggestions(suggestions, maxItems) {
    this.contents = [];

    if (!suggestions.contentSuggestions) {
        this.available = false;
        return;
    }

    var contentSuggestions = suggestions.contentSuggestions;
    var iter = contentSuggestions.suggestedContent;

    this.available = contentSuggestions.hasSuggestions();

    for (var i = 0; i < maxItems; i += 1) {
        var content;

        if (iter.hasNext()) {
            content = iter.next().content;
            if (content.folders && content.folders.length > 0 && content.folders[0].ID && content.folders[0].ID === 'stores-content') {
                i -= 1;
            } else {
                this.contents.push({
                    name: content.name,
                    url: URLUtils.url('Page-Show', 'cid', content.ID)
                });
            }
        }
    }
    if (this.contents.length === 0) {
        this.available = false;
    }
}

module.exports = ContentSuggestions;
