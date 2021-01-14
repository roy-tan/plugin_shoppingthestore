

/**
 * setNextAvailableSlot asyncronous
 */
function setNextAvailableSlot() {
    let url = $('.nextAvailableSlot').data('action');
    const storeId = $('#selectStoreHeader').data('preferredstoreid');
    url = `${url}?storeid=${storeId}`;

    $.ajax({
        url,
        type: 'get',
        dataType: 'html',
        success(response) {
            $('.nextAvailableSlot').empty();
            $('.nextAvailableSlot').append(response);
        },
    });
}

module.exports = {
    setNextAvailableSlot() {
        /**
         * update next available slot if store selected but no slot selected
         */
        if ($('.nextAvailableSlot').length > 0) {
            setNextAvailableSlot(this);
        }
    },
};
