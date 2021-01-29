'use strict';
var server = require('server');
var Logger = require('dw/system/Logger');

server.get('SendCalendar', function(req, res, next) {
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

server.get('Send', function(req, res, next) {
    var Mail = require('dw/net/Mail');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var context = {
        "order": {
            "resources": {
                "noSelectedPaymentMethod": "error.no.selected.payment.method",
                "cardType": "Credit",
                "cardEnding": "Ending",
                "shippingMethod": "Shipping Method",
                "items": "included items",
                "item": "included item",
                "addNewAddress": "New Address",
                "newAddress": "New Address",
                "shipToAddress": "msg.ship.to.address",
                "shippingAddresses": "- Existing Shipments -",
                "accountAddresses": "- Address Book -",
                "shippingTo": "msg.shipping.to",
                "shippingAddress": "Shipping Address:",
                "addressIncomplete": "Please edit shipping address information and save.",
                "giftMessage": "Gift Message:"
            },
            "shippable": false,
            "usingMultiShipping": false,
            "orderNumber": "00000807",
            "priceTotal": "€ 159,53",
            "creationDate": "2021-01-26T09:50:06.278Z",
            "orderEmail": "seth.kroes@gmail.com",
            "orderStatus": {},
            "productQuantityTotal": 1,
            "totals": {
                "subTotal": "€ 79,53",
                "totalShippingCost": "€ 80,00",
                "grandTotal": "€ 159,53",
                "totalTax": "€ 0,00",
                "orderLevelDiscountTotal": {
                    "value": 0,
                    "formatted": "€ 0,00"
                },
                "shippingLevelDiscountTotal": {
                    "value": 0,
                    "formatted": "€ 0,00"
                },
                "discounts": [],
                "discountsHtml": "\n"
            },
            "steps": {
                "shipping": {
                    "iscompleted": true
                },
                "billing": {
                    "iscompleted": true
                }
            },
            "items": {
                "items": [{
                    "uuid": "fa34346fad1ce53ce35580c3ce",
                    "id": "fs-034",
                    "productName": "Dunlop Sportmaxx Tt 205/55R16",
                    "productType": "standard",
                    "brand": "Dunlop",
                    "images": {
                        "small": [{
                            "alt": "Dunlop Sportmaxx Tt 205/55R16",
                            "url": "/on/demandware.static/-/Sites-fs-catalog/default/dw5df907c0/tyres/c45_9091_Dunlop-SP-SportMaxx-TT.png",
                            "title": "Dunlop Sportmaxx Tt 205/55R16",
                            "index": "0",
                            "absURL": "https://zzse-120.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-fs-catalog/default/dw5df907c0/tyres/c45_9091_Dunlop-SP-SportMaxx-TT.png"
                        }]
                    },
                    "variationAttributes": null,
                    "quantity": 1,
                    "isGift": false,
                    "renderedPromotions": "",
                    "UUID": "361fa44c545ea8117d13eeca7f",
                    "shipmentUUID": "80b758913da49247ff225a803c",
                    "isBonusProductLineItem": false,
                    "priceTotal": {
                        "price": "€ 79,53",
                        "renderedPrice": "\n\n\n<div class=\"pricing line-item-total-price-amount item-total-null\n\n\">&euro; 79,53</div>\n<div class=\"strike-through\nnon-adjusted-price\"\n>\n    null\n</div>\n\n"
                    },
                    "options": [],
                    "bonusProductLineItemUUID": null,
                    "preOrderUUID": null,
                    "bonusProducts": null
                }],
                "totalQuantity": 1
            },
            "billing": {
                "billingAddress": {
                    "address": {
                        "address1": "Gustav Mahlerlaan 2970",
                        "address2": null,
                        "city": "Amsterdam",
                        "firstName": "Seth",
                        "lastName": "Kroes",
                        "ID": null,
                        "addressId": null,
                        "phone": "01234 098923",
                        "postalCode": "1081 LA",
                        "stateCode": null,
                        "jobTitle": null,
                        "postBox": null,
                        "salutation": null,
                        "secondName": null,
                        "companyName": null,
                        "suffix": null,
                        "suite": null,
                        "title": null,
                        "countryCode": {
                            "displayValue": "NL",
                            "value": "NL"
                        }
                    }
                },
                "payment": {
                    "applicablePaymentMethods": [{
                            "ID": "GIFT_CERTIFICATE",
                            "name": "Gift Certificate"
                        },
                        {
                            "ID": "CREDIT_CARD",
                            "name": "Credit Card"
                        },
                        {
                            "ID": "PayPal",
                            "name": "Pay Pal"
                        },
                        {
                            "ID": "BML",
                            "name": "Bill Me Later"
                        }
                    ],
                    "applicablePaymentCards": [{
                            "cardType": "Visa",
                            "name": "Visa"
                        },
                        {
                            "cardType": "Amex",
                            "name": "American Express"
                        },
                        {
                            "cardType": "Master Card",
                            "name": "MasterCard"
                        }
                    ],
                    "selectedPaymentInstruments": [{
                        "paymentMethod": "CREDIT_CARD",
                        "amount": 159.53,
                        "lastFour": "1111",
                        "owner": "Seth Kroes",
                        "expirationYear": 2025,
                        "type": "Visa",
                        "maskedCreditCardNumber": "************1111",
                        "expirationMonth": 5
                    }]
                }
            },
            "shipping": [{
                "UUID": "80b758913da49247ff225a803c",
                "productLineItems": {
                    "items": [{
                        "uuid": "fa34346fad1ce53ce35580c3ce",
                        "id": "fs-034",
                        "productName": "Dunlop Sportmaxx Tt 205/55R16",
                        "productType": "standard",
                        "brand": "Dunlop",
                        "images": {
                            "small": [{
                                "alt": "Dunlop Sportmaxx Tt 205/55R16",
                                "url": "/on/demandware.static/-/Sites-fs-catalog/default/dw5df907c0/tyres/c45_9091_Dunlop-SP-SportMaxx-TT.png",
                                "title": "Dunlop Sportmaxx Tt 205/55R16",
                                "index": "0",
                                "absURL": "https://zzse-120.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-fs-catalog/default/dw5df907c0/tyres/c45_9091_Dunlop-SP-SportMaxx-TT.png"
                            }]
                        },
                        "variationAttributes": null,
                        "quantity": 1,
                        "isGift": false,
                        "renderedPromotions": "",
                        "UUID": "361fa44c545ea8117d13eeca7f",
                        "shipmentUUID": "80b758913da49247ff225a803c",
                        "isBonusProductLineItem": false,
                        "priceTotal": {
                            "price": "€ 79,53",
                            "renderedPrice": "\n\n\n<div class=\"pricing line-item-total-price-amount item-total-null\n\n\">&euro; 79,53</div>\n<div class=\"strike-through\nnon-adjusted-price\"\n>\n    null\n</div>\n\n"
                        },
                        "options": [],
                        "bonusProductLineItemUUID": null,
                        "preOrderUUID": null,
                        "bonusProducts": null
                    }],
                    "totalQuantity": 1
                },
                "applicableShippingMethods": [],
                "selectedShippingMethod": {
                    "ID": "EUR001",
                    "displayName": "Installation Fee",
                    "description": null,
                    "estimatedArrivalTime": null,
                    "default": true,
                    "shippingCost": "€ 80,00",
                    "selected": true,
                    "storePickupEnabled": true
                },
                "matchingAddressId": "Zijdstraat 74 - Aalsmeer - 1431 EE",
                "shippingAddress": {
                    "address1": "Zijdstraat 74",
                    "address2": null,
                    "city": "Aalsmeer",
                    "firstName": "Aalsmeer",
                    "lastName": "Aalsmeer",
                    "ID": null,
                    "addressId": null,
                    "phone": "01234 098923",
                    "postalCode": "1431 EE",
                    "stateCode": null,
                    "jobTitle": null,
                    "postBox": null,
                    "salutation": null,
                    "secondName": null,
                    "companyName": null,
                    "suffix": null,
                    "suite": null,
                    "title": null,
                    "countryCode": {
                        "displayValue": "NL",
                        "value": "NL"
                    }
                },
                "isGift": false,
                "giftMessage": null
            }],
            "isMaxOrderEditCntReached": false,
            "isOrderEditTimeWindowOpen": true,
            "isOrderEditAllowed": false,
            "allowReplacement": null,
            "orderStoreId": "nlstore7",
            "slotStartDate": "Wed Jan 27 2021",
            "slotStartTime": "09:00",
            "slotEndTime": "10:00"
        }
    };
    var email = new Mail();
    email.addTo("sylke.kroes@gmail.com");
    email.setSubject("First Stop Appointment Booking");
    email.setFrom("booking@firststop.com");
    email.setContent(renderTemplateHelper.getRenderedHtml(context, 'checkout/confirmation/confirmationEmail'), 'text/html', 'UTF-8');
    email.send();
    next();
});

module.exports = server.exports();