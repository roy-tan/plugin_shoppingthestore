

const focusHelper = require('base/components/focus');
const selectStoreModal = require('../storeLocator/selectStoreModal');

/**
 * Renders a modal window that will track the users consenting to accepting site tracking policy
 */

/**
 * setConsentTrackingEvents
 */
function setConsentTrackingEvents() {
    $('#consent-tracking .button-wrapper button').click(function (e) {
        e.preventDefault();
        const url = $(this).data('url');
        $.ajax({
            url,
            type: 'get',
            dataType: 'json',
            success() {
                $('#consent-tracking').remove();
                $.spinner().stop();
            },
            error() {
                $('#consent-tracking').remove();
                $.spinner().stop();
            },
        });
    });
}

/**
 * showConsentModal
 */
function showConsentModal() {
    if (!$('.tracking-consent').data('caonline')) {
        return;
    }

    const urlContent = $('.tracking-consent').data('url');
    $.spinner().start();

    $.ajax({
        url: urlContent,
        type: 'get',
        dataType: 'html',
        success(response) {
            $('body').append(response);
            setConsentTrackingEvents();

            $('.affirm').click(() => {
                selectStoreModal.showSelectStoreModal(true);
            });
            $('.decline').click(() => {
                selectStoreModal.showSelectStoreModal(true);
            });
        },
        error() {
            $('#consent-tracking').remove();
        },
    });
}

module.exports = function () {
    if ($('.consented').length === 0 && $('.tracking-consent').hasClass('api-true')) {
        showConsentModal();
    }

    if ($('.tracking-consent').hasClass('api-true')) {
        $('.tracking-consent').click(() => {
            showConsentModal();
        });
    }

    $('body').on('shown.bs.modal', '#consent-tracking', () => {
        $('#consent-tracking').siblings().attr('aria-hidden', 'true');
        $('#consent-tracking .close').focus();
    });

    $('body').on('hidden.bs.modal', '#consent-tracking', () => {
        $('#consent-tracking').siblings().attr('aria-hidden', 'false');
    });

    $('body').on('keydown', '#consent-tracking', (e) => {
        const focusParams = {
            event: e,
            containerSelector: '#consent-tracking',
            firstElementSelector: '.affirm',
            lastElementSelector: '.decline',
            nextToLastElementSelector: '.affirm',
        };
        focusHelper.setTabNextFocus(focusParams);
    });
};
