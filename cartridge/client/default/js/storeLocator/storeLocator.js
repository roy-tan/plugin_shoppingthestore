/* globals google */

const storePopup = require('../storeLocator/storePopup');

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    let newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');

    return newUrl;
}

/**
 * get preferred store id from header
 * @returns {string} preferred store id
 */
function getPreferredStoreId() {
    return $('#selectStoreHeader').data('preferredstoreid');
}

/**
 * removeNotAvailableItemsFromBasket
 * call service to remove not available items from basket
 */
function removeNotAvailableItemsFromBasket() {
    const url = $('#changeStoreModal').data('removenotavailableitemsaction');
    $.ajax({
        url,
        type: 'post',
        dataType: 'json',
        success(basketModelPlus) {
            /* todo delete line items in result data from basket popup */

            $('.minicart-quantity').first().html(basketModelPlus.basket.numItems);
        },
    });
}

/**
 * update store result list buttons
 * @param {string} storeId - id of the new store
 */
function showCorrectStoreResultButtons(storeId) {
    $('.infobox').find(`.selectstore[data-storeid!='${storeId}']`).removeClass('d-none');
    $('.infobox').find(`.selectstore[data-storeid='${storeId}']`).addClass('d-none');
    $('.infobox').find(`.list-mystore[data-storeid!='${storeId}']`).addClass('d-none');
    $('.infobox').find(`.list-mystore[data-storeid='${storeId}']`).removeClass('d-none');
}

/**
 * slideUpSearchForm
 * @param {string} visibleButtonId button to be shown
 */
function slideUpSearchForm(visibleButtonId) {
    $('.closebuttons').addClass('d-none');
    $(visibleButtonId).removeClass('d-none');
    $('#searchform').slideUp();
    $('#closecard').slideDown();
}

/**
 * drawSlots
 * Draw the slot selection list when a day is chosen
 * @param {*} dayElement - element containing data-day: date of the slots, e.g. 2020-06-29
 */
function drawSlots(dayElement) {
    const day = $(dayElement).data('day');
    /* Slots for other days invisible */
    $('#slotsarea').find(`.dayslots[data-day!='${day}']`).removeClass('d-block').addClass('d-none');

    /* If day has slots, show them else show no-slots-message */
    if ($('#slotsarea').find(`.dayslots[data-day='${day}']`).length === 0) {
        $('.noslot').removeClass('d-none').addClass('d-block');
    } else {
        $('#slotsarea').find(`.dayslots[data-day='${day}']`).removeClass('d-none').addClass('d-block');
    }
}

/**
 * drawPicker
 * Draw the new picker headline like 'Jun 28 - Jul 4'
 * Draw two views of radio controls for the days:
 *      7 Controls for big screens
 *      3 Controls for mobile
 *
 * */
function drawPicker() {
    const days = $('#daycontainer').data('days');
    const views = [3, 7];

    for (let i = 0; i < views.length; i += 1) {
        const daysFormatted = $('#daycontainer').data('formatteddays');

        let lastDay = (days + views[i]) - 1;
        if (lastDay >= daysFormatted.length) {
            lastDay = daysFormatted.length - 1;
        }
        const htmlStringHeadline = `${daysFormatted[days].format0} - ${daysFormatted[lastDay].format0}`;
        $(`#dayswitch-${views[i]}`).empty();
        $(`#dayswitch-${views[i]}`).append(htmlStringHeadline);

        let htmlStringPickers = '<table>' +
            '<tr>';

        for (let j = days; j < days + views[i] && j < daysFormatted.length; j += 1) {
            const dateformat = daysFormatted[j];
            const column = `${'<td>' +
                '<div class="square-box">' +
                '    <input data-day="'}${dateformat.datekey}" name="radioday" class="radio" type="radio" id="radio-${views[i]}-${dateformat.datekey}"/>` +
                `    <label class="btn btn-primary square-content" for="radio-${views[i]}-${dateformat.datekey}">${
                    dateformat.format1
                }        <br/>${
                    dateformat.format2
                }    </label>` +
                '</div>' +
                '</td>';
            htmlStringPickers += column;

            if ($('#slotsarea').find(`.dayslots[data-day!='${dateformat.datekey}']`).length === 0) {
                $(`#radio-${views[i]}-${dateformat.datekey}`).attr('disabled', true);
            }
        }
        htmlStringPickers += '</tr>' +
            '</table>';

        $(`#table-${views[i]}`).empty();
        $(`#table-${views[i]}`).append(htmlStringPickers);
    }

    $('.radio').change(function () { drawSlots(this); });
}

/**
 * setFirstShownDate
 * @param {*} newStartDate newDays
 * @param {*} step step
 */
function setFirstShownDate(newStartDate, step) {
    let newDays = newStartDate;
    const maxDays = parseInt($('#daycontainer').data('maxdays'), 10);

    /* Prevent new days from getting negative */
    if (newDays <= 0) {
        newDays = 0;
        $('.reduceWeek').addClass('d-none');
    } else {
        $('.reduceWeek').removeClass('d-none');
    }

    /* Prevent new days from exceeding mayDays */
    if (newDays + step >= maxDays) {
        newDays = (maxDays - step);
    }

    if (newDays + 3 >= maxDays) {
        $('.increaseWeek').addClass('d-none');
    } else {
        $('.increaseWeek').removeClass('d-none');
    }

    /* Update currentDays */
    $('#daycontainer').data('days', newDays);
    drawPicker();
}

/**
 * Draw Picker with preselected date
 */
function drawPickerSetDate() {
    const slotDate = $('#pickupdate').data('date') || $('#slotsarea').data('firstavailableslotdate');

    if (slotDate && slotDate !== 'undefined') {
        const focusDate = new Date(slotDate).setHours(0, 0, 0, 0);
        const daystogo = Math.round((focusDate - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
        setFirstShownDate(daystogo, 3);

        const dayslot3 = `#radio-3-${slotDate}`;
        const dayslot7 = `#radio-7-${slotDate}`;
        $(dayslot3).attr('checked', 'checked');
        $(dayslot7).attr('checked', 'checked');
        drawSlots($(dayslot7));
    } else {
        drawPicker();
    }
}

/**
 * updateFirstShownDate
 *
 * @param {*} changeDateButton - element containing the current Day, day step and max days
 */
function updateFirstShownDate(changeDateButton) {
    const currentDays = parseInt($('#daycontainer').data('days'), 10);
    const step = parseInt($(changeDateButton).data('step'), 10);

    const newDays = currentDays + step;

    setFirstShownDate(newDays, step);
}

/**
 * updateHeader
 */
function updateHeader() {
    const url = $('#mystore').data('url');

    $.ajax({
        url,
        type: 'get',
        dataType: 'html',
        success(response) {
            $('#mystore').empty();
            $('#mystore').append(response);
            storePopup.setNextAvailableSlot();
        },
    });
}

/**
 * softreserve
 * call service with storeId, date and time to reserve a slot
 * @param {*} reserveButton - Element containing actionUrl, storeId, date and time to be reserved
 */
function softreserve(reserveButton) {
    const date = $(reserveButton).data('date');
    const time = $(reserveButton).data('time');
    const id = $(reserveButton).data('storeid');
    const slotID = $(reserveButton).data('slotid');

    /* Mark only the new slot as selected */
    $(`#dayslots-${date}`).find(`.yourslot[data-time='${time}']`).removeClass('d-none');
    $(`#dayslots-${date}`).find(`.yourslot[data-time!='${time}']`).addClass('d-none');
    /* Show only select button for not selected slots */
    $(`#dayslots-${date}`).find(`.softreserve[data-time='${time}']`).addClass('d-none');
    $(`#dayslots-${date}`).find(`.softreserve[data-time!='${time}']`).removeClass('d-none');

    /* Update Slot in Store info */
    $('.store-info-flush').find('.slotinfocard').removeClass('d-none');

    let url = $('#slotsarea').data('confirmslot');
    const urlParams = {
        id, slotID,
    };
    url = appendToUrl(url, urlParams);

    $.spinner().start();

    $.ajax({
        url,
        type: 'get',
        dataType: 'html',
        success(response) {
            $('#flushmodal').empty();
            $('#flushmodal').append(response);
            $('#confirmSlot').modal('show');
            $.spinner().stop();
            updateHeader();
        },
        error() {
            $('#reserveFailed').modal('show');
            $.spinner().stop();

            /* Mark new slot as not selected */
            $(`#dayslots-${date}`).find(`.yourslot[data-time='${time}']`).addClass('d-none');
            /* Show all select buttons */
            $(`#dayslots-${date}`).find(`.softreserve[data-time='${time}']`).removeClass('d-none');
        },
    });
}

/**
 * setPickerButtonEvents
 */
function setPickerButtonEvents() {
    $('.changeWeek').click(function () { updateFirstShownDate(this); });
    $('.softreserve').click(function () { softreserve(this); });
}

/**
 * showSearchResults
 */
function showSearchResults() {
    /* Make search results visible */
    $('.results-card .card-header').removeClass('d-none');
    $('.results-card .card-body').removeClass('d-none');
}

/**
 * Draw the picker window after the user selected a store
 * @param {*} data - webservice result object containing the right window
 */
function drawPickerWindow(data) {
    /* replace google maps with calendar */
    $('#mapdiv').slideUp();
    $('#pickerdiv').empty();
    $('#pickerdiv').append(data);

    setPickerButtonEvents();
    drawPickerSetDate();
}

/**
 * removeStoreInfo
 */
function removeStoreInfo() {
    $('.card-header').removeClass('d-none');
    $('.card-body').removeClass('d-none');
    $('.store-info-flush').empty();
}

/**
 * backToSearch
 */
function backToSearch() {
    removeStoreInfo();
    showSearchResults();
}

/**
 * drawStoreInfo
 * @param {*} selectedStoreInfo - html with store info
 */
function drawStoreInfo(selectedStoreInfo) {
    $('.store-info-flush').empty();
    $('.store-info-flush').append(selectedStoreInfo);
    $('.store-info-flush').find('.slotinfocard').addClass('d-none');
}

/**
 * moveProcessBar
 * @param {*} step step the bar schould be moved to
 */
function moveProcessBar(step) {
    $('.dw-wizard').find(`.dw-wizard-progress-item[data-progress="${step}"]`).addClass('is-active');
    $('.dw-wizard').find(`.dw-wizard-progress-item[data-progress!="${step}"]`).removeClass('is-active');
}

/**
 * hideSearchResults
 */
function hideSearchResults() {
    $('.results-card .card-header').addClass('d-none');
    $('.results-card .card-body').addClass('d-none');
}

/**
 * selectStore
 * Select a new store and remove basket elements if required
 * @param {*} element - calling element containing storeId and action url
 * @param {boolean} removeItems - true if items are to be removed
 */
function selectStoreId(element, removeItems) {
    const storeId = element.getAttribute('data-storeid');

    moveProcessBar(3);
    slideUpSearchForm('#buttonshowMap');
    hideSearchResults();
    showCorrectStoreResultButtons(storeId);

    /* draw slot picker */
    $.spinner().start();
    let url = element.getAttribute('data-action');
    url = `${url}?id=${storeId}`;

    $.ajax({
        url,
        type: 'get',
        dataType: 'html',
        success(response) {
            updateHeader();
            $.spinner().stop();

            drawPickerWindow(response);


            url = $('#mystore').data('url');
            url = `${url}?noPopup=${true}&hideButtons=${true}`;

            $.ajax({
                url,
                type: 'get',
                dataType: 'html',
                success(storeInfo) {
                    drawStoreInfo(storeInfo);
                },
            });

            $('.storepopover').removeClass('d-none');

            if (removeItems) {
                removeNotAvailableItemsFromBasket();
            }
        },
    });
}

/**
 * checkBasketAvailability
 * @param {*} element element with storeid
 */
function checkBasketAvailability(element) {
    const storeId = $(element).data('storeid');
    let url = $('#changeStoreModal').data('getnotavailableitemsaction');

    $.spinner().start();
    url = `${url}?id=${storeId}`;

    $.ajax({
        url,
        type: 'get',
        dataType: 'json',
        success(data) {
            $.spinner().stop();

            if (data.notAvailableItems.quantity > 0) {
                /* update modal text with items and store name */
                const storeName = $(element).data('storename');
                $('#nbItemsToBeRemoved').text(data.notAvailableItems.quantity);
                $('#storeNameToBeChangedTo').text(`${storeName}.`);

                $('#btn-continue-box').unbind('click');
                $('#btn-continue-box').click(() => { selectStoreId(element, true); });
                $('#changeStoreModal').modal();
            } else {
                selectStoreId(element, false);
            }
        },
    });
}

/**
 * setSelectStoreEvents
 */
function setSelectStoreEvents() {
    $('.selectstore').click(function () { checkBasketAvailability(this); });
}

/**
 *
 * @param {*} element - element containing preferredStoreId
 */
function drawStoreProfilePage(element) {
    const storeId = $(element).data('storeid');
    let url = $(element).data('action');
    url = `${url}?storeId=${storeId}`;

    $.spinner().start();

    $.ajax({
        url,
        type: 'get',
        dataType: 'json',
        success(data) {
            $.spinner().stop();

            slideUpSearchForm('#buttonshowMap');
            hideSearchResults();
            drawStoreInfo(data.selectedStoreInfo);
            showCorrectStoreResultButtons();

            setSelectStoreEvents();
        },
    });

    url = $(element).data('profileurl');
    url = `${url}?storeId=${storeId}`;

    $.ajax({
        url,
        type: 'get',
        dataType: 'html',
        success(response) {
            $('#mapdiv').slideUp();
            $('#pickerdiv').empty();
            $('#pickerdiv').append(response);
        },
    });
}

/**
 * setProfilePageEvents
 */
function setProfilePageEvents() {
    $('.list-group-flush .store-profile-link').click(function () { drawStoreProfilePage(this); });
    $('#mapdiv .store-profile-link').click(function () { drawStoreProfilePage(this); });
}

/**
 * Uses google maps api to render a map
 */
function maps() {
    const infowindow = new google.maps.InfoWindow();

    // Init U.S. Map in the center of the viewport
    const latlng = new google.maps.LatLng(37.09024, -95.712891);

    const mapOptions = {
        scrollwheel: false,
        zoom: 4,
        center: latlng,
    };

    const map = new google.maps.Map($('.map-canvas')[0], mapOptions);

    let mapdiv = $('.map-canvas').attr('data-locations');

    mapdiv = JSON.parse(mapdiv);

    const bounds = new google.maps.LatLngBounds();

    // Customized google map marker icon with svg format
    const markerImg = {
        path: 'M13.5,30.1460153 L16.8554555,25.5 L20.0024287,25.5 C23.039087,25.5 25.5,' +
            '23.0388955 25.5,20.0024287 L25.5,5.99757128 C25.5,2.96091298 23.0388955,0.5 ' +
            '20.0024287,0.5 L5.99757128,0.5 C2.96091298,0.5 0.5,2.96110446 0.5,5.99757128 ' +
            'L0.5,20.0024287 C0.5,23.039087 2.96110446,25.5 5.99757128,25.5 L10.1445445,' +
            '25.5 L13.5,30.1460153 Z',
        fillColor: '#0070d2',
        fillOpacity: 1,
        scale: 1.1,
        strokeColor: 'white',
        strokeWeight: 1,
        anchor: new google.maps.Point(13, 30),
        labelOrigin: new google.maps.Point(12, 12),
    };

    Object.keys(mapdiv).forEach((key) => {
        const item = mapdiv[key];
        const lable = parseInt(key, 10) + 1;
        const storeLocation = new google.maps.LatLng(item.latitude, item.longitude);
        const marker = new google.maps.Marker({
            position: storeLocation,
            map,
            title: item.name,
            icon: markerImg,
            label: { text: lable.toString(), color: 'white', fontSize: '16px' },
        });

        marker.addListener('click', () => {
            infowindow.setOptions({
                content: item.infoWindowHtml,
            });
            infowindow.open(map, marker);

            google.maps.event.addListener(infowindow, 'domready', () => {
                /* add events for google maps info window */
                setSelectStoreEvents();
                setProfilePageEvents();
                showCorrectStoreResultButtons(getPreferredStoreId());
            });
        });

        // Create a minimum bound based on a set of storeLocations
        bounds.extend(marker.position);
    });
    // Fit the all the store marks in the center of a minimum bounds when any store has been found.
    if (mapdiv && mapdiv.length !== 0) {
        map.fitBounds(bounds);
    }
}

/**
 * setNextAvailableSlots for all list elements
 */
function setNextAvailableSlots() {
    $('.storelist-desktop .list-group-flush .store-profile-link').each(function () {
        const storeId = $(this).data('storeid');
        let url = $(this).data('availableslot');
        url += `?storeid=${storeId}`;

        $.ajax({
            url,
            type: 'get',
            dataType: 'html',
            success(response) {
                const htmlSnippet = `${'<table><tr class="store-address"><td>' +
                    '<i class="fa fa-clock-o" aria-hidden="true"></i>' +
                '</td><td class="pl-2">'}${
                    response
                }</td></tr></table>`;

                $('.storelist-mobile').find(`.storeListNextAvailableSlot[data-storeid='${storeId}']`).append(htmlSnippet);
                $('.storelist-desktop').find(`.storeListNextAvailableSlot[data-storeid='${storeId}']`).append(htmlSnippet);
            },
        });
    });
}

/**
 * Renders the results of the search and updates the map
 * @param {Object} data - Response from the server
 */
function updateStoresResults(data) {
    const hasResults = data.stores.length > 0;
    const $resultsDiv = $('.results');
    const $mapDiv = $('.map-canvas');
    if (hasResults) {
        moveProcessBar(2);
        document.getElementById('mapdiv').scrollIntoView(true);
        $('.store-locator-no-results').hide();
    } else {
        const msgNoSearchResults = $('#buttoncard input').data('msgnoresult');
        $('#buttoncard input').addClass('is-invalid');
        $('#buttoncard .invalid-feedback').html(msgNoSearchResults);
        $('.store-locator-no-results').show();
    }

    if (data.radiusExtended) {
        $('#radius').val($('#radius option:first').val());
    }

    $resultsDiv.empty()
        .data('has-results', hasResults)
        .data('radius', data.radius)
        .data('search-key', data.searchKey);

    $mapDiv.attr('data-locations', data.locations);

    if ($mapDiv.data('has-google-api')) {
        maps();
    }

    if (data.storesResultsHtml) {
        $resultsDiv.append(data.storesResultsHtml);
        setNextAvailableSlots();
    }

    setSelectStoreEvents();
    setProfilePageEvents();
    showCorrectStoreResultButtons(getPreferredStoreId());
}

/**
 * Search for stores with new zip code
 * @param {HTMLElement} element - the target html element
 * @returns {boolean} false to prevent default event
 */
function search(element) {
    const dialog = element.closest('.in-store-inventory-dialog');
    const spinner = dialog.length ? dialog.spinner() : $.spinner();
    spinner.start();
    const $form = element.closest('.store-locator');
    const radius = $('.results').data('radius');
    let url = $form.attr('action');

    const extendRadiusWhenSearchEmpty = $('#radius').attr('data-changedbycustomer') !== 'true';
    const lat = $('#radius').data('lat');
    const long = $('#radius').data('long');
    const urlParams = {
        radius, extendRadiusWhenSearchEmpty, lat, long,
    };

    const payload = $form.is('form') ? $form.serialize() : { postalCode: $form.find('[name="postalCode"]').val() };

    url = appendToUrl(url, urlParams);

    $.ajax({
        url,
        type: $form.attr('method'),
        data: payload,
        dataType: 'json',
        success(data) {
            spinner.stop();

            updateStoresResults(data);
            $('.select-store').prop('disabled', true);
        },
    });
    return false;
}

/**
 * showMap
 */
function showMap() {
    moveProcessBar(1);
    backToSearch();

    /* Get Back the Map */
    $('#mapdiv').slideDown();
    if ($('.map-canvas').data('has-google-api')) {
        maps();
    }

    /* Delete the picker window */
    $('#pickerdiv').empty();
}

module.exports = {
    init() {
        if ($('.map-canvas').data('has-google-api')) {
            maps();
        }

        if (!$('.results').first().data('has-results')) {
            $('.store-locator-no-results').show();
        } else {
            $('.store-locator-no-results').hide();
        }

        setNextAvailableSlots();

        /* Set global button events */
        $('.slideUpSearchForm').click(() => {
            $('#searchform').slideDown();
            $('#closecard').slideUp();
            $('.store-info-flush').empty();
        });
        setProfilePageEvents();
        setSelectStoreEvents();
        showCorrectStoreResultButtons(getPreferredStoreId());
        $('#closeSearchResults').click(() => { backToSearch(); });
        $('#closeSearchResultsShowMap').click(() => { showMap(); });

        /* Show picker instead of Map */
        if ($('#mapdiv').data('hideafterinit')) {
            moveProcessBar(3);
            slideUpSearchForm('#buttonshowMap');
            hideSearchResults();
            drawPickerSetDate();
            setPickerButtonEvents();
            $('#mapdiv').hide();
            $('#buttonshowMap').click(() => { showMap(); });
        }
    },

    detectLocation() {
        // clicking on detect location.
        $('.detect-location').on('click', () => {
            $.spinner().start();
            if (!navigator.geolocation) {
                $.spinner().stop();
                return;
            }

            navigator.geolocation.getCurrentPosition((position) => {
                const $detectLocationButton = $('.detect-location');
                let url = $detectLocationButton.data('action');
                let radius = $('.results').data('radius');

                $('#radius').data('lat', position.coords.latitude);
                $('#radius').data('long', position.coords.longitude);

                const extendRadiusWhenSearchEmpty = $('#radius').attr('data-changedbycustomer') !== 'true';
                if (extendRadiusWhenSearchEmpty) {
                    $('#radius').val($('#radius option:eq(1)').val());
                    radius = $('#radius option:eq(1)').val();
                }
                const urlParams = {
                    radius,
                    lat: position.coords.latitude,
                    long: position.coords.longitude,
                    extendRadiusWhenSearchEmpty,
                };

                url = appendToUrl(url, urlParams);
                $.ajax({
                    url,
                    type: 'get',
                    dataType: 'json',
                    success(data) {
                        $.spinner().stop();
                        updateStoresResults(data);
                        $('.select-store').prop('disabled', true);
                    },
                });
            });
        });
    },

    search() {
        $('.store-locator-container form.store-locator').submit(function (e) {
            e.preventDefault();
            search($(this));
        });
        $('.store-locator-container .btn-storelocator-search[type="button"]').click(function (e) {
            e.preventDefault();
            search($(this));
        });
    },

    changeRadius() {
        $('.store-locator-container .radius').change(function () {
            const radius = $(this).val();
            const searchKeys = $('.results').data('search-key');
            let url = $(this).data('action-url');
            const extendRadiusWhenSearchEmpty = false;
            const lat = $('#radius').data('lat') || searchKeys.lat;
            const long = $('#radius').data('long') || searchKeys.long;
            const urlParams = {
                radius,
                extendRadiusWhenSearchEmpty,
                lat,
                long,
            };

            if (searchKeys.postalCode) {
                urlParams.postalCode = searchKeys.postalCode;
            }

            $('#radius').attr('data-changedbycustomer', !extendRadiusWhenSearchEmpty);
            $('#radius').data('changedbycustomer', !extendRadiusWhenSearchEmpty);
            url = appendToUrl(url, urlParams);

            const dialog = $(this).closest('.in-store-inventory-dialog');
            const spinner = dialog.length ? dialog.spinner() : $.spinner();
            spinner.start();
            $.ajax({
                url,
                type: 'get',
                dataType: 'json',
                success(data) {
                    spinner.stop();
                    updateStoresResults(data);
                    $('.select-store').prop('disabled', true);
                },
            });
        });
    },
    selectStore() {
        $('.store-locator-container').on('click', '.select-store', ((e) => {
            e.preventDefault();
            const selectedStore = $(':checked', '.results-card .results');
            const data = {
                storeID: selectedStore.val(),
                searchRadius: $('#radius').val(),
                searchPostalCode: $('.results').data('search-key').postalCode,
                storeDetailsHtml: selectedStore.siblings('label').find('.store-details').html(),
                event: e,
            };

            $('body').trigger('store:selected', data);
        }));
    },
    updateSelectStoreButton() {
        $('body').on('change', '.select-store-input', (() => {
            $('.select-store').prop('disabled', false);
        }));
    },
};
