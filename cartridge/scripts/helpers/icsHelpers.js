'use strict';
var Resource = require('dw/web/Resource');

function formatDate(date, time) {
    var now = new Date(date + ' ' + time + ' GMT+0100');
    var isoDate = new Date(now);
    var icsDate = isoDate.toISOString().replace(/-/g, "").replace(/:/g, "").replace(".000Z", "Z");
    return icsDate;
}

function getCalendar(slotDate, startTime, endTime, description, location) {
    var currentDate = new Date();
    var now = formatDate(currentDate.toDateString(), currentDate.getHours() + ":" + currentDate.getMinutes());
    var calendar =
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Google Inc//Google Calendar 70.9054//EN\n" +
        "VERSION:2.0\n" +
        "CALSCALE:GREGORIAN\n" +
        "METHOD:PUBLISH\n" +
        "X-WR-TIMEZONE:" + Resource.msg('timezone', 'calendar', null) + "\n" +
        "BEGIN:VEVENT\n" +
        "DTSTART:" + formatDate(slotDate, startTime) + "\n" +
        "DTEND:" + formatDate(slotDate, endTime) + "\n" +
        "DTSTAMP:" + now + "\n" +
        "CREATED:" + now + "\n" +
        "DESCRIPTION:" + description + "\n" +
        "LAST-MODIFIED:" + now + "\n" +
        "LOCATION:" + location + "\n" +
        "SEQUENCE:0\n" +
        "STATUS:CONFIRMED\n" +
        "SUMMARY:" + Resource.msg('summary', 'calendar', null) + "\n" +
        "ORGANIZER;CN=" + Resource.msg('organizer', 'calendar', null) + ":mailto:" + Resource.msg('mailto', 'calendar', null) + "\n" +
        "TRANSP:OPAQUE\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR"
    return calendar;
}

function sendCalendar(emailObj, orderObj) {
    var order = orderObj.order;
    var location = order.shipping[0].shippingAddress.address1 + ", " + order.shipping[0].shippingAddress.postalCode + ", " + order.shipping[0].shippingAddress.city;
    var vCalendar = getCalendar(order.slotStartDate, order.slotStartTime, order.slotEndTime, order.orderNumber, location);
    var Mail = require('dw/net/Mail');
    var email = new Mail();
    email.addTo(emailObj.to);
    email.setSubject(emailObj.subject);
    email.setFrom(emailObj.from);
    email.setContent(vCalendar, 'text/calendar', 'UTF-8');
    email.send();
}

module.exports = {
    sendCalendar: sendCalendar
};