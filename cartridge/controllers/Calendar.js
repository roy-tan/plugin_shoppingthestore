'use strict';
var server = require('server');
var Logger = require('dw/system/Logger');

server.get('Get', function(req, res, next) {
    var ics = require('*/cartridge/scripts/helpers/icsHelpers');
    var vCalendar = ics.sendCalendar("Tue Jan 26 2021", "09:00", "10:00", "First Stop Appointment Booking", "Zijdstraat 74, Aalsmeer");
    var Mail = require('dw/net/Mail');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var email = new Mail();
    email.addTo("sylke.kroes@gmail.com");
    email.setSubject("First Stop Appointment Booking");
    email.setFrom("booking@firststop.com");
    email.setContent(vCalendar, 'text/calendar', 'UTF-8');
    email.send();
    next();
});

module.exports = server.exports();