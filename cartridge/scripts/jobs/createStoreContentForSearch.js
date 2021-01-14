
var Logger = require('dw/system/Logger');
var FileWriter = require('dw/io/FileWriter');
var Status = require('dw/system/Status');
var File = require('dw/io/File');

/**
 * Writes the Pricebook XML in SFCC format with 0 price for a given store for product in
 * the productIdList.
 *
 * @param {Object} libraryId - libraryId
 * @param {Object} contentFolderId - StoreID for which the inventory pricebook is created
 * @param {Object} storeList - storeList
 * @param {Object} outFolder - Output IMPEX folder where the file is written
* @return {Object} - an object with relevant search information
 */
function writeStoreContent(libraryId, contentFolderId, storeList, outFolder) {
    var fileWriter;
    var contentId = contentFolderId;
    var pathOutDir = [File.IMPEX, outFolder].join(File.SEPARATOR);
    var fileOutDir = new File(pathOutDir);
    if (!fileOutDir.exists()) {
        fileOutDir.mkdirs();
    }

    var pathOut = [File.IMPEX, outFolder, contentId + '.xml'].join(File.SEPARATOR);
    var fileOut = new File(pathOut);

    try {
        fileWriter = new FileWriter(fileOut, 'UTF-8', true);
        fileWriter.writeLine('<?xml version="1.0" encoding="UTF-8"?>');
        fileWriter.writeLine('<library xmlns="http://www.demandware.com/xml/impex/library/2006-10-31" library-id="' + libraryId + '">');
        fileWriter.writeLine('  <folder folder-id="' + contentFolderId + '">');
        fileWriter.writeLine('      <display-name xml:lang="x-default">' + contentFolderId + '</display-name>');
        fileWriter.writeLine('      <description xml:lang="x-default">Folder for store content to enable fuzzy search</description>');
        fileWriter.writeLine('      <online-flag>true</online-flag>');
        fileWriter.writeLine('      <parent>root</parent>');
        fileWriter.writeLine('      <page-attributes/>');
        fileWriter.writeLine('  </folder>');

        storeList.toArray().forEach(function (store) {
            var storeCity = '';
            var address1 = '';
            var address2 = '';
            var storeName = '';
            var description = '';
            var events = '';
            if (store.name) {
                storeName = store.name.replace('&', '&amp;');
                description = storeName;
            }
            if (store.city) {
                storeCity = store.city.replace('&', '&amp;');
                description += ', ' + storeCity;
            }
            if (store.stateCode) {
                description += ', ' + store.stateCode;
            }
            if (store.postalCode) {
                description += ', ' + store.postalCode;
            }
            if (store.address1) {
                address1 = store.address1.replace('&', '&amp;');
                description += ', ' + address1;
            }
            if (store.address2) {
                address2 = store.address2.replace('&', '&amp;');
                description += ', ' + address2;
            }
            if (store.storeEvents && store.storeEvents.markup) {
                events = store.storeEvents.markup.replace('&', '&amp;');
                description += ', ' + events;
            }
            description = description.replace(new RegExp('<', 'g'), '&lt;');
            description = description.replace(new RegExp('>', 'g'), '&gt;');

            fileWriter.writeLine('    <content content-id="' + store.ID + '">');
            fileWriter.writeLine('        <display-name xml:lang="x-default">' + storeName + '</display-name>');
            fileWriter.writeLine('        <description xml:lang="x-default">' + description + '</description>');
            fileWriter.writeLine('        <online-flag>true</online-flag>');
            fileWriter.writeLine('        <searchable-flag>true</searchable-flag>');
            fileWriter.writeLine('        <page-attributes/>');
            fileWriter.writeLine('        <custom-attributes>');
            fileWriter.writeLine('            <custom-attribute attribute-id="body" xml:lang="x-default">{');
            fileWriter.writeLine('"longitude": "' + store.longitude + '",');
            fileWriter.writeLine('"latitude": "' + store.latitude + '"');
            fileWriter.writeLine('}</custom-attribute>');
            fileWriter.writeLine('        </custom-attributes>');
            fileWriter.writeLine('        <folder-links>');
            fileWriter.writeLine('            <classification-link folder-id="' + contentFolderId + '"/>');
            fileWriter.writeLine('        </folder-links>');
            fileWriter.writeLine('    </content>');
        });
        fileWriter.writeLine('</library>');

        return new Status(Status.OK, 'OK', 'Content created for:' + storeList.length + ' stores with NO ERRORS.');
    } catch (e) {
        Logger.error('Error writing availability pricebook: {0}', e);
        return new Status(Status.ERROR, 'ERROR', 'Caught error during creation of new inventory XML for store no: ' + outFolder);
    } finally {
        // eslint-disable-next-line no-unused-expressions
        fileWriter && fileWriter.close();
    }
}

/**
 * This function searches for all the orders placed since last job run. It iterates over those orders
 * and product line items. For each line item, checks if it is in stock in the respective inventory
 * list used to place the order. Calls function to create inventory pricebook per store.
 *
 * @param {Object} args - Input arcguments from the job configuration
 * @return {Object} - an object with relevant search information
 */
function createStoreContentForSearch(args) {
    var outputFolder = args.outputFolder;
    var libraryId = args.libraryId;

    var StoreMgr = require('dw/catalog/StoreMgr');
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var storeMgrResult = StoreMgr.searchStoresByCoordinates(0, 0, 'km', storeHelpers.EARTH_CIRCUMFERENCE);
    var stores = storeMgrResult.keySet();

    return writeStoreContent(libraryId, 'stores-content', stores, outputFolder);
}

exports.createStoreContentForSearch = createStoreContentForSearch;
