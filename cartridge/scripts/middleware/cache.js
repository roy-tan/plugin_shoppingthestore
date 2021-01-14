'use strict';

var base = module.superModule;

/**
 * Applies a very short expiration value for the page cache.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
*/
function applyVeryShortCache(req, res, next) {
    res.cachePeriod = 1; // eslint-disable-line no-param-reassign
    res.cachePeriodUnit = 'minutes'; // eslint-disable-line no-param-reassign
    next();
}

module.exports = {
    applyDefaultCache: base.applyDefaultCache,
    applyPromotionSensitiveCache: base.applyPromotionSensitiveCache,
    applyInventorySensitiveCache: base.applyInventorySensitiveCache,
    applyShortPromotionSensitiveCache: base.applyShortPromotionSensitiveCache,
    applyVeryShortCache: applyVeryShortCache
};
