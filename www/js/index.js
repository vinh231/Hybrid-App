var ERROR = 'ERROR';
var currentPropertyId = 'currentPropertyId';
var db = window.openDatabase('FGW', '1.0', 'FGW', 20000);

if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
    $(document).on('deviceready', onDeviceReady);
}
else {
    $(document).on('ready', onDeviceReady);
}

$(window).on('orientationchange', onOrientationChange);

$(document).on('vclick', '#page-home #panel-open', function () {
    $('#page-home #panel').panel('open');
});

$(document).on('vclick', '#page-create #panel-open', function () {
    $('#page-create #panel').panel('open');
});

$(document).on('vclick', '#page-list #panel-open', function () {
    $('#page-list #panel').panel('open');
});

$(document).on('vclick', '#page-about #panel-open', function () {
    $('#page-about #panel').panel('open');
});

// Page CREATE
$(document).on('pagebeforeshow', '#page-create', function () {
    prepareForm('#page-create #frm-register');
});

$(document).on('submit', '#page-create #frm-register', confirmProperty);
$(document).on('submit', '#page-create #frm-confirm', registerProperty);
$(document).on('vclick', '#page-create #frm-confirm #edit', function () {
    $('#page-create #frm-confirm').popup('close');
});

$(document).on('change', '#page-create #frm-register #city', function () {
    addAddressOption_District($('#page-create #frm-register #district'), this.value);
    addAddressOption_Ward($('#page-create #frm-register #ward'), -1);
});

$(document).on('change', '#page-create #frm-register #district', function () {
    addAddressOption_Ward($('#page-create #frm-register #ward'), this.value);
});

// Page LIST
$(document).on('pagebeforeshow', '#page-list', showList);

$(document).on('submit', '#page-list #frm-search', search);

$(document).on('keyup', $('#page-list #txt-filter'), filterProperty);

$(document).on('change', '#page-list #frm-search #city', function () {
    addAddressOption_District($('#page-list #frm-search #district'), this.value);
    addAddressOption_Ward($('#page-list #frm-search #ward'), -1);
});

$(document).on('change', '#page-list #frm-search #district', function () {
    addAddressOption_Ward($('#page-list #frm-search #ward'), this.value);
});

$(document).on('vclick', '#page-list #btn-reset', showList);
$(document).on('vclick', '#page-list #btn-filter-popup', openFormSearch);
$(document).on('vclick', '#page-list #list-property li a', navigatePageDetail);

// Page DETAIL
$(document).on('pagebeforeshow', '#page-detail', showDetail);

$(document).on('vclick', '#page-detail #img-preview #btn-close', function () {
    $('#page-detail #img-preview').css('display', 'none');
    $('#page-detail #img-preview #gallery').empty();
});

$(document).on('vclick', '#page-detail #note #frm-add-note #btn-gallery', function () {
    getImage(true, Camera.PictureSourceType.PHOTOLIBRARY);
});
$(document).on('vclick', '#page-detail #note #frm-add-note #btn-camera', function () {
    getImage(true, Camera.PictureSourceType.CAMERA);
});

$(document).on('vclick', '#page-detail #btn-toggle-note', function() {
    var noteDisplay = $('#page-detail #note').css('display');

    $('#page-detail #note').css('display', noteDisplay == 'none' ? 'block' : 'none');
});

$(document).on('vclick', '#page-detail #note #list #btn-update-note', updateNoteConfirm);
$(document).on('vclick', '#page-detail #note #list #btn-delete-note', deleteNoteConfirm);
$(document).on('vclick', '#page-detail #btn-update-popup', showUpdate);
$(document).on('vclick', '#page-detail #btn-delete-popup', function () {
    changePopup($('#page-detail #option'), $('#page-detail #frm-delete'));
});

$(document).on('vclick', '#page-detail #frm-update #cancel', function () {
    $('#page-detail #frm-update').popup('close');
});

$(document).on('submit', '#page-detail #note #frm-add-note', addNote);
$(document).on('reset', '#page-detail #note #frm-update-note', resetNote);
$(document).on('submit', '#page-detail #note #frm-update-note', updateNote);
$(document).on('submit', '#page-detail #frm-delete-note', deleteNote);
$(document).on('submit', '#page-detail #frm-update', updateProperty);
$(document).on('submit', '#page-detail #frm-delete', deleteProperty);
$(document).on('keyup', '#page-detail #frm-delete #txt-confirm', confirmDeleteProperty);

$(document).on('change', '#page-detail #frm-update #city', function () {
    addAddressOption_District($('#page-detail #frm-update #district'), this.value);
    addAddressOption_Ward($('#page-detail #frm-update #ward'), -1);
});

$(document).on('change', '#page-detail #frm-update #district', function () {
    addAddressOption_Ward($('#page-detail #frm-update #ward'), this.value);
});

function onDeviceReady() {
    log(`Device is ready.`);

    prepareDatabase(db);
}

function onOrientationChange(e) {
    if (e.orientation == 'portrait') {
        log('Portrait.');
    }
    else {
        log('Landscape.');
    }
}

function changePopup(sourcePopup, destinationPopup) {
    var afterClose = function () {
        destinationPopup.popup("open");
        sourcePopup.off("popupafterclose", afterClose);
    };

    sourcePopup.on("popupafterclose", afterClose);
    sourcePopup.popup("close");
}

function prepareForm(form) {
    addAddressOption($(`${form} #city`), 'City');
    addAddressOption_District($(`${form} #district`), -1);
    addAddressOption_Ward($(`${form} #ward`), -1);

    addOption($(`${form} #furniture`), Furniture, 'Furniture');
    addOption($(`${form} #type`), Type, 'Type');
}

function addAddressOption_District(select, selectedId, selectedValue = -1) {
    addAddressOption(select, 'District', selectedValue, `WHERE CityId = ${selectedId}`);
}

function addAddressOption_Ward(select, selectedId, selectedValue = -1) {
    addAddressOption(select, 'Ward', selectedValue, `WHERE DistrictId = ${selectedId}`);
}

function addAddressOption(select, name, selectedValue = -1, condition = '') {
    db.transaction(function (tx) {
        var query = `SELECT * FROM ${name} ${condition} ORDER BY Name`;
        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of ${name} successfully.`);

            var optionList = `<option value="-1">Select ${name}</option>`;

            for (let item of result.rows) {
                optionList += `<option value="${item.Id}" ${item.Id == selectedValue ? 'selected' : ''}>${item.Name}</option>`;
            }

            select.html(optionList);
            select.selectmenu('refresh', true);
        }
    });
}

function addOption(select, list, name, selectedValue = -1) {
    var optionList = `<option value="-1">Select ${name}</option>`;

    for (var key in list) {
        optionList += `<option value="${list[key]}" ${list[key] == selectedValue ? 'selected' : ''}>${key}</option>`;
    }

    select.html(optionList);
    select.selectmenu('refresh', true);
}

function getFormInfoByValue(form, isNote) {
    var note = isNote ? $(`${form} #note`).val() : '';

    var info = {
        'Name': $(`${form} #name`).val(),
        'Street': $(`${form} #street`).val(),
        'City': $(`${form} #city`).val(),
        'District': $(`${form} #district`).val(),
        'Ward': $(`${form} #ward`).val(),
        'Type': $(`${form} #type`).val(),
        'Bedroom': $(`${form} #bedroom`).val(),
        'Price': $(`${form} #price`).val(),
        'Furniture': $(`${form} #furniture`).val(),
        'Reporter': $(`${form} #reporter`).val(),
        'Note': note
    };

    return info;
}

function getFormInfoByName(form, isNote) {
    var note = isNote ? $(`${form} #note`).val() : '';

    var info = {
        'Name': $(`${form} #name`).val(),
        'Street': $(`${form} #street`).val(),
        'City': $(`${form} #city option:selected`).text(),
        'District': $(`${form} #district option:selected`).text(),
        'Ward': $(`${form} #ward option:selected`).text(),
        'Type': $(`${form} #type option:selected`).text(),
        'Bedroom': $(`${form} #bedroom`).val(),
        'Price': $(`${form} #price`).val(),
        'Furniture': $(`${form} #furniture option:selected`).text(),
        'Reporter': $(`${form} #reporter`).val(),
        'Note': note
    };

    return info;
}

function setFormInfo(form, info, isNote) {
    $(`${form} #name`).val(info.Name);
    $(`${form} #street`).val(info.Street);
    $(`${form} #city`).val(info.City);
    $(`${form} #district`).val(info.District);
    $(`${form} #ward`).val(info.Ward);
    $(`${form} #type`).val(info.Type);
    $(`${form} #bedroom`).val(info.Bedroom);
    $(`${form} #price`).val(info.Price);
    $(`${form} #furniture`).val(info.Furniture);
    $(`${form} #reporter`).val(info.Reporter);

    if (isNote)
        $(`${form} #note`).val(info.Note);
}

function setHTMLInfo(form, info, isNote, isDate = false) {
    $(`${form} #name`).text(info.Name);
    $(`${form} #street`).text(info.Street);
    $(`${form} #city`).text(info.City);
    $(`${form} #district`).text(info.District);
    $(`${form} #ward`).text(info.Ward);
    $(`${form} #type`).text(info.Type);
    $(`${form} #bedroom`).text(info.Bedroom);
    $(`${form} #price`).text(`${info.Price.toLocaleString('en-US')} VNĐ / month`);
    $(`${form} #furniture`).text(info.Furniture);
    $(`${form} #reporter`).text(info.Reporter);

    if (isNote)
        $(`${form} #note`).text(info.Note);

    if (isDate)
        $(`${form} #date`).text(info.DateAdded);
}

function isValid(form) {
    var isValid = true;
    var error = $(`${form} #error`);

    error.empty();

    if ($(`${form} #city`).val() == -1) {
        isValid = false;
        error.append('<p>* City is required.</p>');
    }

    if ($(`${form} #district`).val() == -1) {
        isValid = false;
        error.append('<p>* District is required.</p>');
    }

    if ($(`${form} #ward`).val() == -1) {
        isValid = false;
        error.append('<p>* Ward is required.</p>');
    }

    if ($(`${form} #type`).val() == -1) {
        isValid = false;
        error.append('<p>* Type is required.</p>');
    }

    return isValid;
}

function confirmProperty(e) {
    e.preventDefault();

    if (isValid('#page-create #frm-register')) {
        var info = getFormInfoByName('#page-create #frm-register', true);

        db.transaction(function (tx) {
            var query = 'SELECT * FROM Property WHERE Name = ?';
            tx.executeSql(query, [info.Name], transactionSuccess, transactionError);

            function transactionSuccess(tx, result) {
                if (result.rows[0] == null) {
                    log('Open the confirmation popup.');

                    $('#page-create #error').empty();

                    setHTMLInfo('#page-create #frm-confirm', info, true);

                    $('#page-create #frm-confirm').popup('open');
                }
                else {
                    var error = 'Name exists.';
                    $('#page-create #error').empty().append(error);
                    log(error, ERROR);
                }
            }
        });
    }
}

function registerProperty(e) {
    e.preventDefault();

    var info = getFormInfoByValue('#page-create #frm-register', true);

    db.transaction(function (tx) {
        var query = `INSERT INTO Property (Name, Street, City, District, Ward, Type, Bedroom, Price, Furniture, Reporter, DateAdded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, julianday('now'))`;
        tx.executeSql(query, [info.Name, info.Street, info.City, info.District, info.Ward, info.Type, info.Bedroom, info.Price, info.Furniture, info.Reporter], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Create a property '${info.Name}' successfully.`);

            $('#page-create #frm-register').trigger('reset');
            $('#page-create #error').empty();
            $('#page-create #frm-register #name').focus();

            $('#page-create #frm-confirm').popup('close');

            db.transaction(function (tx) {
                var query = `INSERT INTO Note (Message, PropertyId, DateAdded) VALUES (?, ?, julianday('now'))`;
                tx.executeSql(query, [info.Note, result.insertId], transactionSuccess, transactionError);

                function transactionSuccess(tx, result) {
                    log(`Add new note to property '${info.Name}' successfully.`);
                }
            });
        }
    });
}

function showList() {
    db.transaction(function (tx) {
        var query = `SELECT Property.Id AS Id, Property.Name AS Name, Price, Bedroom, Type, City.Name AS City
                     FROM Property LEFT JOIN City ON Property.City = City.Id`;

        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of properties successfully.`);
            displayList(result.rows);
        }
    });
}

function navigatePageDetail(e) {
    e.preventDefault();

    var id = $(this).data('details').Id;
    localStorage.setItem(currentPropertyId, id);

    $.mobile.navigate('#page-detail', { transition: 'none' });
}

function showDetail() {
    var id = localStorage.getItem(currentPropertyId);

    db.transaction(function (tx) {
        var query = `SELECT Property.*, datetime(Property.DateAdded, '+7 hours') AS DateAddedConverted, City.Name AS CityName, District.Name AS DistrictName, Ward.Name AS WardName
                     FROM Property
                     LEFT JOIN City ON City.Id = Property.City
                     LEFT JOIN District ON District.Id = Property.District
                     LEFT JOIN Ward ON Ward.Id = Property.Ward
                     WHERE Property.Id = ?`;

        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] != null) {
                log(`Get details of property '${result.rows[0].name}' successfully.`);

                var info = {
                    'Name': result.rows[0].Name,
                    'Street': result.rows[0].Street,
                    'City': result.rows[0].CityName,
                    'District': result.rows[0].DistrictName,
                    'Ward': result.rows[0].WardName,
                    'Type': Object.keys(Type)[result.rows[0].Type],
                    'Bedroom': result.rows[0].Bedroom,
                    'Price': result.rows[0].Price,
                    'Furniture': Object.keys(Furniture)[result.rows[0].Furniture],
                    'Reporter': result.rows[0].Reporter,
                    'DateAdded': result.rows[0].DateAddedConverted
                };

                setHTMLInfo('#page-detail #detail', info, false, true);

                showNote();
            }
            else {
                var errorMessage = 'Property not found.';

                log(errorMessage, ERROR);

                $('#page-detail #detail #name').text(errorMessage);
                $('#page-detail #btn-update').addClass('ui-disabled');
                $('#page-detail #btn-delete-confirm').addClass('ui-disabled');
            }
        }
    });
}

function confirmDeleteProperty() {
    var text = $('#page-detail #frm-delete #txt-confirm').val();

    if (text == 'confirm delete') {
        $('#page-detail #frm-delete #btn-delete').removeClass('ui-disabled');
    }
    else {
        $('#page-detail #frm-delete #btn-delete').addClass('ui-disabled');
    }
}

function deleteProperty(e) {
    e.preventDefault();

    var id = localStorage.getItem(currentPropertyId);

    db.transaction(function (tx) {
        var query = 'DELETE FROM Note WHERE PropertyId = ?';
        tx.executeSql(query, [id], function (tx, result) {
            log(`Delete notes of property '${id}' successfully.`);
        }, transactionError);

        var query = 'DELETE FROM Property WHERE Id = ?';
        tx.executeSql(query, [id], function (tx, result) {
            log(`Delete property '${id}' successfully.`);

            $('#page-detail #frm-delete').trigger('reset');

            $.mobile.navigate('#page-list', { transition: 'none' });
        }, transactionError);
    });
}

function addNote(e) {
    e.preventDefault();

    var id = localStorage.getItem(currentPropertyId);
    var message = $('#page-detail #note #frm-add-note #message').val();

    if (message != '' || $('#page-detail #img-preview').css('display') != 'none') {
        db.transaction(function (tx) {
            var query = `INSERT INTO Note (Message, PropertyId, DateAdded) VALUES (?, ?, julianday('now'))`;
            tx.executeSql(query, [message, id], transactionSuccess, transactionError);

            function transactionSuccess(tx, result) {
                log(`Add new note to property '${id}' successfully.`);

                addNoteImage(result.insertId);
            }
        });
    }
}

function addNoteImage(noteId) {
    db.transaction(function (tx) {
        var image = $('#page-detail #img-preview #gallery img');
        var query = 'INSERT INTO NoteImage (Image, NoteId) VALUES (?, ?)';

        for (var i = 0; i < image.length; i++) {
            var src = image[i].src;
            tx.executeSql(query, [src.substring(23, src.length), noteId], transactionSuccess, transactionError);
        }

        function transactionSuccess(tx, result) {
            log(`Add note image for note '${noteId}' successfully.`);
        }

        $('#page-detail #img-preview').css('display', 'none');
        $('#page-detail #img-preview #gallery').empty();
        $('#page-detail #note #frm-add-note').trigger('reset');

        showNote();
    });
}

function showNote() {
    var id = localStorage.getItem(currentPropertyId);

    db.transaction(function (tx) {
        var query = `SELECT Id, Message, datetime(DateAdded, '+7 hours') AS DateAdded FROM Note WHERE PropertyId = ? ORDER BY DateAdded DESC`;

        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of notes successfully.`);

            var noteList = '';
            for (let note of result.rows) {
                noteList += `
                    <div class='list' id='note-${note.Id}'>
                        <table style='white-space: nowrap;'>
                            <tr>
                                <th rowspan='2'><img src='img/boyscout_logo.jpg' class='avatar'></th>
                                <td style='width: 100%;'><strong>Boy Scout</strong></td>
                                <td style='text-align: right; vertical-align: top;' rowspan='2'>
                                    <a id='btn-update-note' data-details='{"Id" : ${note.Id}, "Message" : "${note.Message}"}' style='font-size: 10px;'
                                        class='ui-btn ui-icon-edit ui-alt-icon ui-btn-icon-notext ui-nodisc-icon ui-btn-inline ui-mini transparent'></a>

                                    <a id='btn-delete-note' data-details='{"Id" : ${note.Id}, "Message" : "${note.Message}"}' style='font-size: 10px; margin-left: 5px;'
                                        data-rel='popup' data-position-to='window'
                                        class='ui-btn ui-icon-delete ui-alt-icon ui-btn-icon-notext ui-nodisc-icon ui-btn-inline ui-mini transparent'></a>
                                </td>
                            </tr>

                            <tr>
                                <td><small>${note.DateAdded}</small></td>
                            </tr>
                        </table>

                        <p id='message-${note.Id}'>${note.Message}</p>

                        <p id='image-${note.Id}' style='overflow-x: scroll; white-space: nowrap;'></p>
                    </div>`;

                appendNoteImage(note.Id);
            }

            noteList += `<div class='list end-list'>You've reached the end of the list.</div>`;

            $('#page-detail #note #list').empty().append(noteList);

            log(`Show list of notes successfully.`);
        }
    });
}

function appendNoteImage(noteId) {
    db.transaction(function (tx) {
        query = 'SELECT Image FROM NoteImage WHERE NoteId = ?';

        tx.executeSql(query, [noteId], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            var imageList = '';
            for (let image of result.rows)
                imageList += `<img src='data:image/jpeg;base64,${image.Image}' class='note-image'>`;

            $(`#page-detail #note #list #image-${noteId}`).append(imageList);
        }
    });
}

function showUpdate() {
    var id = localStorage.getItem(currentPropertyId);

    db.transaction(function (tx) {
        var query = `SELECT * FROM Property WHERE Id = ?`;

        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] != null) {
                log(`Get details of property '${result.rows[0].Name}' successfully.`);

                $(`#page-detail #frm-update #name`).val(result.rows[0].Name);
                $(`#page-detail #frm-update #street`).val(result.rows[0].Street);
                $(`#page-detail #frm-update #price`).val(result.rows[0].Price);
                $(`#page-detail #frm-update #bedroom`).val(result.rows[0].Bedroom);
                $(`#page-detail #frm-update #reporter`).val(result.rows[0].Reporter);

                addAddressOption($('#page-detail #frm-update #city'), 'City', result.rows[0].City);
                addAddressOption_District($('#page-detail #frm-update #district'), result.rows[0].City, result.rows[0].District);
                addAddressOption_Ward($('#page-detail #frm-update #ward'), result.rows[0].District, result.rows[0].Ward);

                addOption($('#page-detail #frm-update #type'), Type, 'Type', result.rows[0].Type);
                addOption($('#page-detail #frm-update #furniture'), Furniture, 'Furniture', result.rows[0].Furniture);

                changePopup($('#page-detail #option'), $('#page-detail #frm-update'));
            }
        }
    });
}

function updateProperty(e) {
    e.preventDefault();

    if (isValid('#page-detail #frm-update')) {
        var id = localStorage.getItem(currentPropertyId);
        var info = getFormInfoByValue('#page-detail #frm-update', false);

        db.transaction(function (tx) {
            var query = `UPDATE Property
                        SET Name = ?,
                            Street = ?, City = ?, District = ?, Ward = ?,
                            Type = ?, Bedroom = ?, Price = ?, Furniture = ?, Reporter = ?,
                            DateAdded = julianday('now')
                        WHERE Id = ?`;

            tx.executeSql(query, [info.Name, info.Street, info.City, info.District, info.Ward, info.Type, info.Bedroom, info.Price, info.Furniture, info.Reporter, id], transactionSuccess, transactionError);

            function transactionSuccess(tx, result) {
                log(`Update property '${info.Name}' successfully.`);

                showDetail();

                $('#page-detail #frm-update').popup('close');
            }
        });
    }
}

function filterProperty() {
    var filter = $('#page-list #txt-filter').val().toLowerCase();
    var li = $('#page-list #list-property ul li');

    for (var i = 0; i < li.length; i++) {
        var a = li[i].getElementsByTagName("a")[0];
        var text = a.textContent || a.innerText;

        li[i].style.display = text.toLowerCase().indexOf(filter) > -1 ? "" : "none";
    }
}

function openFormSearch(e) {
    e.preventDefault();
    prepareForm('#page-list #frm-search');
    $('#page-list #frm-search').popup('open');
}

function search(e) {
    e.preventDefault();

    var name = $('#page-list #frm-search #name').val();
    var street = $('#page-list #frm-search #street').val();
    var city = $('#page-list #frm-search #city').val();
    var district = $('#page-list #frm-search #district').val();
    var ward = $('#page-list #frm-search #ward').val();
    var type = $('#page-list #frm-search #type').val();
    var bedroom = $('#page-list #frm-search #bedroom').val();
    var furniture = $('#page-list #frm-search #furniture').val();
    var reporter = $('#page-list #frm-search #reporter').val();
    var priceMin = $('#page-list #frm-search #price-min').val();
    var priceMax = $('#page-list #frm-search #price-max').val();

    db.transaction(function (tx) {
        var query = `SELECT Property.Id AS Id, Property.Name AS Name, Price, Bedroom, Type, City.Name AS City
                     FROM Property LEFT JOIN City ON Property.City = City.Id
                     WHERE`;

        query += name ? ` Property.Name LIKE "%${name}%"   AND` : '';
        query += street ? ` Street LIKE "%${street}%"   AND` : '';
        query += city != -1 ? ` City = ${city}   AND` : '';
        query += district != -1 ? ` District = ${district}   AND` : '';
        query += ward != -1 ? ` Ward = ${ward}   AND` : '';
        query += type != -1 ? ` Type = ${type}   AND` : '';
        query += bedroom ? ` Bedroom = ${bedroom}   AND` : '';
        query += furniture != -1 ? ` Furniture = ${furniture}   AND` : '';
        query += reporter ? ` Reporter LIKE "%${reporter}%"   AND` : '';
        query += priceMin ? ` Price >= ${priceMin}   AND` : '';
        query += priceMax ? ` Price <= ${priceMax}   AND` : '';

        query = query.substring(0, query.length - 6);

        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Search properties successfully.`);

            displayList(result.rows);

            $('#page-list #frm-search').trigger('reset');
            $('#page-list #frm-search').popup('close');
        }
    });
}

function displayList(list) {
    var propertyList = `<ul id='list-property' data-role='listview' class='ui-nodisc-icon ui-alt-icon'>`;

    propertyList += list.length == 0 ? '<li><h2>There is no property.</h2></li>' : '';

    for (let property of list) {
        propertyList +=
            `<li><a data-details='{"Id" : ${property.Id}}'>
                <h2 style='margin-bottom: 0px;'>${property.Name}</h2>
                <p style='margin-top: 2px; margin-bottom: 10px;'><small>${property.City}</small></p>

                <div>

                    <strong style='font-size: 13px;'>${property.Bedroom}<strong>

                    &nbsp;&nbsp;


                    <strong style='font-size: 13px;'>${Object.keys(Type)[property.Type]}<strong>

                    &nbsp;&nbsp;


                    <strong style='font-size: 13px;'>${property.Price.toLocaleString('en-US')} VNĐ / month<strong>
                </div>
            </a></li>`;
    }
    propertyList += `</ul>`;

    $('#list-property').empty().append(propertyList).listview('refresh').trigger('create');

    log(`Show list of properties successfully.`);
}

function getImage(saveToPhotoAlbum, sourceType) {
    var options = {
        destinationType: Camera.DestinationType.DATA_URL,
        saveToPhotoAlbum: saveToPhotoAlbum,
        sourceType: sourceType
    };

    navigator.camera.getPicture(success, error, options);

    function success(imageData) {
        var display = $('#page-detail #img-preview').css('display');

        if (display == 'none') {
            $('#page-detail #img-preview #gallery').empty();
            $('#page-detail #img-preview').css('display', 'block');
        }

        $('#page-detail #img-preview #gallery').append(`<img src='data:image/jpeg;base64,${imageData}'>`);
    }

    function error(error) {
        alert(`Failed to get picture. Error: ${error}.`);
    }
}

function deleteNoteConfirm(e) {
    e.preventDefault();

    var data = $(this).data('details');

    $('#page-detail #frm-delete-note #id').text(data.Id);
    $('#page-detail #frm-delete-note #message').text(`Message: "${data.Message}"`);

    $('#page-detail #frm-delete-note').popup('open');
}

function deleteNote(e) {
    e.preventDefault();

    var noteId = $('#page-detail #frm-delete-note #id').text();

    db.transaction(function (tx) {
        var query = `DELETE FROM Note WHERE Id = ?`;

        tx.executeSql(query, [noteId], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Delete note '${noteId}' successfully.`);

            deleteNoteImage(noteId);
        }
    });
}

function deleteNoteImage(noteId) {
    db.transaction(function (tx) {
        var query = `DELETE FROM NoteImage WHERE NoteId = ?`;

        tx.executeSql(query, [noteId], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Delete images of note '${noteId}' successfully.`);

            $('#page-detail #frm-delete-note #id').text('');
            $('#page-detail #frm-delete-note #message').text('');
            $('#page-detail #frm-delete-note').popup('close');

            $(`#page-detail #note #list #note-${noteId}`).remove();
        }
    });
}

function updateNoteConfirm(e) {
    e.preventDefault();

    var data = $(this).data('details');

    $(`#page-detail #note #list #note-${data.Id} #message-${data.Id}`).html(`
        <form id='frm-update-note' data-details='{"Id" : ${data.Id}}'>
            <table>
                <tr>
                    <td style='width: 100%; padding-right: 5px;'>
                        <textarea id='message' name='message' rows='3' style='width: 100%;'>${data.Message}</textarea>
                    </td>

                    <td>
                        <button type='submit' class='ui-btn ui-icon-check ui-corner-all ui-btn-icon-notext ui-nodisc-icon ui-btn-inline ui-mini green' style='margin-bottom: 5px;'></button>
                        <button type='reset' class='ui-btn ui-icon-delete ui-corner-all ui-btn-icon-notext ui-nodisc-icon ui-btn-inline ui-mini red'></button>
                    </td>
                </tr>
            </table>
        </form>
    `);
}

function updateNote(e) {
    e.preventDefault();

    var id = $(this).data('details').Id;
    var message = $(`#page-detail #note #list #note-${id} #message-${id} #message`).val();

    db.transaction(function (tx) {
        var query = `UPDATE Note SET Message = ? WHERE Id = ?`;

        tx.executeSql(query, [message, id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Update note '${id}' successfully.`);

            $(`#page-detail #note #list #note-${id} #message-${id}`).text(message);
        }
    });
}

function resetNote(e) {
    e.preventDefault();

    var id = $(this).data('details').Id;
    var message = $(`#page-detail #note #list #note-${id} #message-${id} #message`).text();

    $(`#page-detail #note #list #note-${id} #message-${id}`).text(message);
}

/*
function takeQRCode() {
    cordova.plugins.barcodeScanner.scan(success, error);

    function success(result) {
        alert(`Result: ${result.text}.\nType: ${result.format}.`);
    }

    function error(error) {
        alert(`Failed: ${error}.`);
    }
}
*/