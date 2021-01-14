
/**
 * showSelectStoreModal
 */
function showSelectStoreModal() {
    $('#selectStoreModal').modal({ keyboard: false });
    $('#btn-noStore').click(() => {
        const url = $('#btn-noStore').data('action');

        $.ajax({
            url,
        }).done(() => {
            // redirect to homepage
            const redirectUrl = $('#btn-noStore').data('redirecturl');
            window.location.href = redirectUrl;
        });
    });
}

/**
 * drawSelectStoreModal
 * Modal Dialog to let shopper select a store
 */
function drawSelectStoreModal() {
    const url = $('.headerselectstore').data('selectstoremodalurl');

    $.spinner().start();
    $.ajax({
        url,
        type: 'get',
        dataType: 'json',
        success(data) {
            $('body').append(data.selectStoreModal);
            $.spinner().stop();
            if (!($('.consented').length === 0 && $('.tracking-consent').hasClass('api-true'))) {
                showSelectStoreModal();
            }
        },
    });
}

module.exports = {
    init() {
        if (($('.login-page').length === 0) && ($('.detect-location').length === 0) && ($('.headerselectstore').length !== 0) && $('.headerselectstore').data('showstoreselectormodal')) {
            drawSelectStoreModal();
        }
    },
    showSelectStoreModal(show) {
        if (show) {
            showSelectStoreModal();
        }
    },
};
