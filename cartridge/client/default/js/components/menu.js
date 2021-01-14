const base = require('base/components/menu');

const keyboardAccessibilityStore = require('base/components/keyboardAccessibility');

module.exports = {
    base,
    function() {
        keyboardAccessibilityStore(
            '.navbar-header .store',
            {
                40() { // down
                },
                38() { // up
                },
                27() { // escape
                    $('.navbar-header .store .popover').removeClass('show');
                    $('.store').attr('aria-expanded', 'false');
                },
                9() { // tab
                },
            },
            () => {
                const $popover = $('.store.popover li.nav-item');
                return $popover;
            },
        );

        /* Open Popover on Mouse over */
        $('.navbar-header .store').on('mouseenter focusin', () => {
            if ($('.navbar-header .store .popover').length > 0) {
                $('.navbar-header .store .popover').addClass('show');
                $('.store').attr('aria-expanded', 'true');
            }
        });

        /* Close Popover on Mouse leave */
        $('.navbar-header .store').on('mouseleave', () => {
            $('.navbar-header .store .popover').removeClass('show');
            $('.store').attr('aria-expanded', 'false');
        });

        $('body').on('click', '#mystore', (event) => {
            event.preventDefault();
        });

        /* Hide toggler when opening menu */
        $('.navbar-toggler').click(() => {
            $('.navbar-toggler').hide();
        });
        /* Show toggler after closing menu */
        $('.navbar>.close-menu>.close-button').on('click', () => {
            $('.navbar-toggler').show();
        });
        $('.navbar-nav').on('click', '.close-button', () => {
            $('.navbar-toggler').show();
        });
    },
};
