// jshint devel:true

/**
 * Main logic
 * Author: tgr.
 * Last changed: 27/2/2015
 */

// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function() {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];
        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());
//Test
// taken from http://stackoverflow.com/questions/28966476/localecompare-shows-inconsistent-behavior-when-sorting-words-with-leading-umlaut/28968707
var akjkj = true;
String.prototype.correctLocaleCompare = function(right, idx) {
    idx = (idx == undefined) ? 0 : idx++;

    var run = right.length <= this.length ? (idx < right.length - 1 ? true : false) : (idx < this.length - 1 ? true : false);

    if (!run) {
        if (this[0].localeCompare(right[0]) == 0) {
            return this.localeCompare(right);
        } else {
            return this[0].localeCompare(right[0])
        }
    }

    if (this.localeCompare(right) != this[0].localeCompare(right[0])) {
        var myLeft = this.slice(1, this.length);
        var myRight = right.slice(1, right.length);
        if (myLeft.localeCompare(myRight) != myLeft[0].localeCompare(myRight[0])) {
            return myLeft.correctLocaleCompare(myRight, idx);
        } else {
            if (this[0].localeCompare(right[0]) == 0) {
                return myLeft.correctLocaleCompare(myRight, idx);
            } else {
                return this[0].localeCompare(right[0])
            }
        }
    } else {
        return this.localeCompare(right);
    }
};

// some sort of a sprintf replacement, taken from http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}
// another polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function(searchString, position) {
            position = position || 0;
            return this.lastIndexOf(searchString, position) === position;
        }
    });
}
/* GLOBAL CONSTANTS */
var SECO_TABLE_COUNT_PER_PAGE = 15;
var SECO_SEARCHABLE_CHART_COUNT = 9;

/* NAMESPACES */
var server = {};
var data = {};
data.current = {};
var ui = {};
var locale = {};


/* GLOBAL VARIABLES */
var isMobile = false;

// analytics variables
/*analytics.page_reached = null;
analytics.has_shared_via_fb = 0;
analytics.has_shared_via_tw = 0;
analytics.has_shared_via_mail = 0;
analytics.came_via_share = 0;
analytics.is_mobile = 0;
analytics.ua_string = navigator.userAgent;
analytics.interaction_count = 0;
analytics.looked_at_wisdom = 0;
analytics.impress_was_looked_at = 0;*/


/**
 * Init
 * Initializes the application
 * Runs as soon as the DOM is ready
 */
$(function() {
    console.log('SRF Data here, welcome to the console.');

    window.isMobile = window.detectDevice();

    // Init app
    window.init();

});

/** GLOBAL **/
/**
 * Cookie-Functions (http://www.quirksmode.org/js/cookies.html#script)
 */
window.createCookie = function(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toGMTString();
    } else {
        expires = '';
    }
    document.cookie = name + '=' + value + expires + '; path=/';
};

/**
 *
 */
window.readCookie = function(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
};


/**
 *
 */
window.detectDevice = function() {
    return $('.device-xs').is(':visible');
};

/**
 * Global app constructor
 * Only executed once
 */
window.init = function() {
    // add spinner
    d3.select('body').append('div')
        .attr('class', 'srfdata-spinner')
        .html('Wird geladen...<br/>')
        .append('i')
        .attr('class', 'fa fa-spinner fa-spin');
    // hook events
    // redraw vis on window resize - insert toggler here! 

    $(window).on('resize', $.throttle(250, function() {
        console.log('window resized');
        window.isMobile = window.detectDevice();
        ui.renderAll();
        ui.postHeightOfIframe();
    }));
    // once data is loaded, draw vis and ui elements
    $(window).on('server.dataLoaded', function() {
        ui.prepare();
        ui.renderAll();
        ui.renderButtons();
        ui.postHeightOfIframe();
    });
    $(window).on('data.filtered', $.throttle(500, function() {
        console.log('data filtered');
        ui.renderAll();
        ui.renderButtons();
        ui.postHeightOfIframe();
    }));

    // load data
    server.loadData();
};

/* LOCALE */

// Define D3 locale
locale.de_CH = d3.locale({
    'decimal': '.',
    'thousands': '\'',
    'grouping': [3],
    'currency': ['CHF', ''],
    'dateTime': '%A, %d.%m.%Y, %X Uhr',
    'date': '%d.%m.%Y',
    'time': '%H:%M:%S',
    'periods': ['AM', 'PM'],
    'days': ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    'shortDays': ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    'months': ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    'shortMonths': ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
});

locale.abbrVolumeCHF = function(initialValue) {
    var millions = initialValue / 1000000;
    if (initialValue >= 1000000000) {
        var billions = millions / 1000;
        return /*'CHF ' + */ locale.de_CH.numberFormat(',.2g')(billions).replace('.0', '') + ' Mrd.';
    } else if (initialValue >= 1000000) {
        return /*'CHF ' + */ locale.de_CH.numberFormat(',.1f')(millions).replace('.0', '') + ' Mio.';
    } else if (initialValue >= 100000) {
        return /*'CHF ' + */ locale.de_CH.numberFormat(',.2f')(millions).replace('.00', '') + ' Mio.';
    } else if (initialValue < 10000) {
        return /*'CHF ' + */ locale.de_CH.numberFormat(',d')(initialValue).replace('\'', '');
    } else {
        return /*'CHF ' + */ locale.de_CH.numberFormat(',d')(initialValue);
    }
};

locale.fullVolumeCHF = function(initialValue) {
    var number = locale.de_CH.numberFormat(',f')(initialValue);
    if (initialValue < 10000) {
        number = number.replace('\'', '');
    }
    return 'CHF ' + number + '.-';
};

/* UI */

ui.elements = {};

ui.postHeightOfIframe = function() {
    var height = $('body').height();
    window.top.postMessage({
        'action': 'srf.resize-iframe',
        'height': height + 20
    }, '*');
    console.log('parent notified of height');
};

ui.prepare = function() {

    // function to show a tooltip for searchable category barchart
    var showCategoryTooltip = function(key, value, top, width) {
        var category = this._lookupTable[key];
        var directory = this._lookupTableForSuperscript[key];
        var examples = this._lookupTableForTooltip[key];
        this._divs.each(function() {
            var div = d3.select(this),
                currentTooltip = div.select('div.tooltip');

            if (currentTooltip.empty()) {
                var tooltip = div.append('div')
                    .attr('class', 'tooltip')
                    .style('display', 'none');
                tooltip.append('h1')
                    .attr('class', 'category');
                tooltip.append('h2')
                    .html('Beispiele');
                tooltip.append('p')
                    .attr('class', 'examples');
                currentTooltip = tooltip;
            }


            currentTooltip.select('h1.category')
                .html(category + '<sup>' + directory + '</sup>' + ' im Wert von CHF ' + locale.abbrVolumeCHF(value));

            currentTooltip.select('p.examples')
                .html(examples);


            var tooltipTop = parseInt(top) - $(currentTooltip.node()).height() - 25 + 'px';
            if (parseInt(tooltipTop) < 0) {
                tooltipTop = parseInt(top) + 80 + 'px';
            } else {
                tooltipTop = parseInt(top) - $(currentTooltip.node()).height() - 0 + 'px';;
            }
            currentTooltip.style('top', tooltipTop);

            currentTooltip.style('display', 'block');
        });
    };

    var showCountryTooltip = function(key, value, top, width) {
            this._divs.each(function() {
                var div = d3.select(this),
                    currentTooltip = div.select('div.tooltip');

                if (currentTooltip.empty()) {
                    var tooltip = div.append('div')
                        .attr('class', 'tooltip')
                        .style('display', 'none');
                    tooltip.append('h1')
                        .attr('class', 'country');
                    currentTooltip = tooltip;
                }

                currentTooltip.select('h1.country')
                    .html('Exporte nach ' + key + ' im Wert von CHF ' + locale.abbrVolumeCHF(value));

                var tooltipTop = parseInt(top) - $(currentTooltip.node()).height() - 25 + 'px';
                if (parseInt(tooltipTop) < 0) {
                    tooltipTop = parseInt(top) + 80 + 'px';
                } else {
                    tooltipTop = parseInt(top) - $(currentTooltip.node()).height() - 0 + 'px';;
                }
                currentTooltip.style('top', tooltipTop);

                currentTooltip.style('display', 'block');
            });
        }
        // remove spinner
    d3.select('.srfdata-spinner')
        .style('display', 'none');
    // make container visible
    d3.select('.container')
        .style('display', 'block');
    var secoCatchphrases = [
        (new ui.elements.Catchphrase())
        .dimension(data.dimensions.date)
        .current(data.current)
    ];
    // instantiate a table class for each .srfdata-table
    var secoTables = [
        (new ui.elements.Table())
        .dimension(data.dimensions.date)
        .rowsPerPage(SECO_TABLE_COUNT_PER_PAGE)
        .columns([{
            'label': 'Datum',
            'sortable': true,
            'identifier': 'Datum',
            'type': 'date'
        }, {
            'label': 'Land',
            'sortable': true,
            'identifier': 'Land',
            'type': 'string'
        }, {
            'label': 'Kategorie',
            'sortable': true,
            'identifier': 'VerzeichnisHaupttyp',
            'type': 'string',
            'lookupTable': data.lookup.category
        }, {
            'label': 'Exportvolumen',
            'sortable': true,
            'identifier': 'Wert',
            'type': 'currency'
        }, ])
    ];
    // instantiate a DraggableHistogram class for each .srfdata-draggable-histogram
    var secoDraggableHistograms = [
        (new ui.elements.DraggableHistogram())
        .dimension(data.dimensions.date)
        .current(data.current)
        .currentDimension('date')
        .group(data.groups.months)
        .tooltip(true)
        .round(d3.time.month.round)
        .title('Bewilligtes Exportvolumen nach Monat (in CHF)')
        .xScale(d3.time.scale()
            .domain([new Date(Date.UTC(2012, 0, 1)), new Date(Date.UTC(2014, 11, 31))]))
    ];
    // instantiate a SearchableBarchart class for each .srfdata-searchable-barchart
    var secoSearchableBarcharts = [(new ui.elements.SearchableBarchart())
        .dimension(data.dimensions.country)
        .current(data.current)
        .currentDimension('country')
        .group(data.groups.country)
        .title('Nach Land')
        .tooltipFunction(showCountryTooltip)
        .numberOfGroups(SECO_SEARCHABLE_CHART_COUNT), (new ui.elements.SearchableBarchart())
        .dimension(data.dimensions.category)
        .current(data.current)
        .currentDimension('category')
        .group(data.groups.category)
        .title('Nach Güterkategorie')
        .tooltipFunction(showCategoryTooltip)
        .lookupTable(data.lookup.category)
        .lookupTableForSuperscript(data.lookup.directory)
        .lookupTableForTooltip(data.lookup.category_examples)
        .numberOfGroups(SECO_SEARCHABLE_CHART_COUNT)
    ];
    ui.elements.secoCatchphrases = d3.selectAll('.srfdata-catchphrase')
        .data(secoCatchphrases);
    ui.elements.secoTables = d3.selectAll('.srfdata-table')
        .data(secoTables);
    ui.elements.secoDraggableHistograms = d3.selectAll('.srfdata-draggable-histogram')
        .data(secoDraggableHistograms)
    ui.elements.secoSearchableBarcharts = d3.selectAll('.srfdata-searchable-barchart')
        .data(secoSearchableBarcharts)
        /*.each(function(secoDraggableHistogram) {
            secoDraggableHistogram.on('brush', ui.renderAll).on('brushend', ui.renderAll);
        });*/

    /* Buttons */
    var secoButtons = [(new ui.elements.FilterButton())
        .filters([{
            'value': [new Date(Date.UTC(2014, 2, 30)), new Date(Date.UTC(2014, 11, 31))] /*[locale.de_CH.timeFormat.utc('%Y-%m-%d').parse('2014-04-01'), locale.de_CH.timeFormat.utc('%Y-%m-%d').parse('2014-12-31')]*/ ,
            'label': 'date',
            'type': 'extent'
        }, {
            'value': 'Russland',
            'label': 'country',
            'type': 'exact'
        }, {
            'value': null,
            'label': 'category',
            'type': 'exact'
        }])
        .dimensions(data.dimensions)
        .current(data.current)
        .label('Konflikt in der Ukraine'), (new ui.elements.FilterButton())
        .filters([{
            'value': null,
            'label': 'date',
            'type': 'extent'
        }, {
            'value': 'Saudi-Arabien',
            'label': 'country',
            'type': 'exact'
        }, {
            'value': 'ML (GKV)14',
            'label': 'category',
            'type': 'exact'
        }])
        .dimensions(data.dimensions)
        .current(data.current)
        .label('Simulatoren an Saudi-Arabien'), (new ui.elements.FilterButton())
        .filters([{
            'value': null,
            'label': 'date',
            'type': 'extent'
        }, {
            'value': 'Katar',
            'label': 'country',
            'type': 'exact'
        }, {
            'value': null,
            'label': 'category',
            'type': 'exact'
        }])
        .dimensions(data.dimensions)
        .current(data.current)
        .label('Katar rüstet auf'), (new ui.elements.FilterButton())
        .filters([{
            'value': null,
            'label': 'date',
            'type': 'extent'
        }, {
            'value': null,
            'label': 'country',
            'type': 'exact'
        }, {
            'value': null,
            'label': 'category',
            'type': 'exact'
        }])
        .dimensions(data.dimensions)
        .current(data.current)
        .label('Alles zurücksetzen')
    ];

    ui.elements.secoButtons = d3.selectAll('.srfdata-button')
        .data(secoButtons);

    // little workaround to make buttons "active" when clicked
    /*$(".srfdata-button").on('mousedown mouseup mouseleave', function(e) {
        $(this).toggleClass('active', e.type === 'mousedown');
    });*/
}

ui.renderAll = function() {

    var render = function(obj) {
        obj.render(d3.select(this));
    };

    if (!window.isMobile) {
        ui.elements.secoTables.each(render);
    }
    // render charts
    ui.elements.secoDraggableHistograms.each(render);
    ui.elements.secoSearchableBarcharts.each(render);
    ui.elements.secoCatchphrases.each(render);

    console.log('ui rerendered');
}

ui.renderButtons = function() {
    var render = function(obj) {
        obj.render(d3.select(this));
    };
    // render buttons
    ui.elements.secoButtons.each(render);
    /*
    ui.elements.secoSearchableBarcharts.each(render);
    ui.elements.secoCatchphrases.each(render);*/

    console.log('buttons rerendered');
}

ui.elements.PresentationElement = function() {
    this._dimension = null; // holds the crossfilter dimension to visualize, gettable / setable
    this._current = null; // holds the reference to the data.current object, gettable / setable
    this._currentDimension = null; // specifies which data dimension is visualized, gettable / settable
    this._divs = []; // divs to be rendered in, non-configurable

    /* Public methods */
    this.dimension = function(newDimension) {
        if (!arguments.length) {
            return this._dimension;
        }
        this._dimension = newDimension;
        return this;
    };
    this.current = function(newCurrent) {
        if (!arguments.length) {
            return this._current;
        }
        this._current = newCurrent;
        return this;
    };
    this.currentDimension = function(newCurrentDimension) {
        if (!arguments.length) {
            return this._currentDimension;
        }
        this._currentDimension = newCurrentDimension;
        return this;
    };
};

ui.elements.ResettablePresentationElement = function() {
    // call parent constructor
    ui.elements.PresentationElement.call(this);
    var self = this;
    this._dirty = false; // set to true if something has been filtered

    this._title = null; // holds the title of the element, settable / getable

    this._group = null; // holds the crossfilter group, settable / getable

    /* Private methods */
    this._reset = function() {
        this._dimension.filterAll();
        this._dirty = false;
        this._current[this._currentDimension] = null;
        $(window).trigger('data.filtered');
    };

    this._setTitle = function() {
        this._divs.each(function() {
            var div = d3.select(this);
            var titleDiv = div.selectAll('div.title')
                .data([self._title])
                .enter()
                .append('div')
                .attr('class', 'title');
            titleDiv.append('h3').text(function(d) {
                return d;
            });
            titleDiv.append('span')
                .attr('class', 'reset');
            div.selectAll('span.reset')
                .html(function() {
                    return self._dirty ? '&times;' : '';
                })
                .on('click', function() {
                    if (self._dirty) {
                        self._reset();
                    }
                })
            titleDiv.append('hr');
        })
    };
    /* Public methods */
    this.group = function(newGroup) {
        if (!arguments.length) {
            return this._group;
        }
        this._group = newGroup;
        return this;
    };

    this.title = function(newTitle) {
        if (!arguments.length) {
            return this._title;
        }
        this._title = newTitle;
        return this;
    };
};

/* 
 * Catchphrase Class
 */
ui.elements.Catchphrase = function() {
    // call parent constructor
    ui.elements.PresentationElement.call(this);

    var defaults = {
        'date': 'vom Januar 2012 bis zum Dezember 2014',
        'category': 'militärisch verwendbaren Gütern',
        'volume': '',
        'country': 'in 135 Länder'
    };
    var self = this;

    /* Private methods */
    computeObjects = function() {
        var objects = _.clone(defaults);
        var currentData = _.clone(self._dimension.top(Infinity));

        // find out if more than one country
        // var currentCountries = _.uniq(currentData, 'Land');
        if (self._current['country'] !== undefined && self._current['country'] !== null) {
            objects.country = 'nach ' + self._current['country'] + '';
        }
        // find out if more than one category
        if (self._current['category'] !== undefined && self._current['category'] !== null) {
            objects.category = 'Gütern der Kategorie ‹' + data.lookup.category[self._current['category']] + '›';
        }
        // find out volume
        var currentVolume = _.reduce(currentData, function(sum, n) {
            return sum + parseFloat(n['Wert']);
        }, 0);
        objects.volume = 'CHF ' + locale.abbrVolumeCHF(currentVolume);
        // find out time range
        if (self._current['date'] !== undefined && self._current['date'] !== null) {
            var dates = _.clone(self._current['date'], true);
            var monthYear = locale.de_CH.timeFormat.utc('%B %Y');
            var begin = dates[0];
            // add artificial month
            // begin.setMonth(begin.getMonth() + 1);
            var end = dates[1];
            // some shifting needs to be done for stupid reasons
            if (navigator.userAgent.search(/MSIE 10.0/i) !== -1 || navigator.userAgent.search(/MSIE 9.0/i) !== -1) {
                end.setMonth(end.getMonth() - 1);
            } else {
                begin.setMonth(begin.getMonth() + 1);
            }

            if (monthYear(begin) === monthYear(end)) {
                objects.date = 'im ' + monthYear(begin);
            } else {
                objects.date = 'vom ' + monthYear(begin) + ' bis zum ' + monthYear(end);
            }
        }
        return objects;

    };
    /* Public methods */
    self.render = function(divsToBeRenderedIn) {
        self._divs = divsToBeRenderedIn || self._divs;
        var objects = computeObjects();
        var html = sprintf('«Die Schweiz hat <span class="date">%(date)s</span> den Export von <span class="category">%(category)s</span> im Wert von <span class="volume">%(volume)s</span> <span class="country">%(country)s</span> bewilligt.»', objects);
        // add twitter button
        /*var twitterMessage =
            var twitterButton = '<a class="twitter" href="' + twitterMessage + '"></a>'*/
        self._divs.each(function() {
            var div = d3.select(this),
                h1 = div.select('h1');
            if (h1.empty()) {
                h1 = div.append('h1');
            }
            h1.html(html);
        })

    };
};

/* Table class 
 */
ui.elements.Table = function() {
    // call parent constructor
    ui.elements.PresentationElement.call(this);
    var self = this;
    /* Private variables */
    var columns = [], // column specifications, settable / getable
        rowsPerPage = 20, // row per page, settable / getable
        sortColumn = 3, // index of column to sort after (default: first column)
        sortOrderAscending = false, // default sort order
        numberOfConcurrentPages = 9, // number of concurrent pages to show in pagination menu
        maxPage = 1, // for internal use only, non-configurable
        minPage = 1, // for internal use only, non-configurable
        currentPage = 1, // for internal use only, non-configurable
        currentData = []; // for internal use only, non-configurable



    /* Private methods */
    var reorder = function(newColumn) {
        if (sortColumn === newColumn) {
            sortOrderAscending = !sortOrderAscending;
        } else {
            sortOrderAscending = true;
        }
        sortColumn = newColumn;
        currentPage = 1;
        // rerender from within
        self.render();
    };

    var changePage = function(newPage) {
        currentPage = newPage;
        // console.log('page changed');
        // rerender from within
        var dataToBeShown = currentData.filter(function(d) {
            return +d.key === currentPage;
        });
        redrawTable(dataToBeShown);
    }

    var paginateData = function(dataToPaginate) {
        var i = 0;
        var j = 0;
        var paginatedData = d3.nest()
            .key(function(d) {
                // after 10, increment j by 1, thus creating a new subgroup (page)
                if (i++ % rowsPerPage === 0) {
                    j++;
                }
                return '' + j;
            })
            .entries(dataToPaginate);
        maxPage = j;
        // console.log('data paginated');
        return paginatedData;
    };

    var sortData = function() {
        // order data
        if (columns[sortColumn].type !== 'string') {
            var sorter = crossfilter.quicksort.by(function(d) {
                return d[columns[sortColumn].identifier];
            });
            sorter(currentData, 0, currentData.length);
        } else {
            currentData.sort(function(a, b) {
                a = a[columns[sortColumn].identifier];
                b = b[columns[sortColumn].identifier];
                if (columns[sortColumn].lookupTable) {
                    a = columns[sortColumn].lookupTable[a];
                    b = columns[sortColumn].lookupTable[b];
                }
                return a.correctLocaleCompare(b);
            });
        }
        if (!sortOrderAscending) {
            currentData.reverse();
        }

        // console.log('data sorted');

        currentData = paginateData(currentData);
    }

    var preparePaginationMenu = function() {
        var pageRange = Math.floor(numberOfConcurrentPages / 2);
        var pagesArray = [];
        if (minPage === maxPage || maxPage === 0) { // maxPage === 0 if empty list
            return pagesArray;
        }
        pagesArray.push({
            'label': '< zurück',
            'clickable': currentPage !== minPage,
            'clickHandler': function() {
                if (currentPage !== minPage) {
                    changePage(currentPage - 1)
                }
            }
        });
        pagesArray.push({
            'label': '' + minPage,
            'clickable': true,
            'active': currentPage === minPage,
            'clickHandler': function(j) {
                return function() {
                    changePage(j);
                };
            }(minPage)
        });
        if ((currentPage - pageRange - 1) > minPage) {
            pagesArray.push({
                'label': '...',
                'clickable': false,
                'active': false,
                'clickHandler': null
            });
        }
        var numbersAroundCurrent = [];
        for (var i = (currentPage + pageRange >= maxPage) ? (maxPage - 2 * pageRange) : (currentPage - pageRange); i <= currentPage + pageRange; i++) {
            if (i <= minPage - 1) {
                pageRange++;
            }
            if (i > minPage && i < maxPage) {
                numbersAroundCurrent.push(i);
            }
        }
        numbersAroundCurrent.forEach(function(d, i) {
            pagesArray.push({
                'label': '' + d,
                'clickable': true,
                'active': currentPage === d,
                'clickHandler': function(j) {
                    return function() {
                        changePage(j);
                    };
                }(d)
            });
        });
        if ((currentPage + pageRange + 1) < maxPage) {
            pagesArray.push({
                'label': '...',
                'clickable': false,
                'active': false,
                'clickHandler': null
            });
        }
        pagesArray.push({
            'label': '' + maxPage,
            'clickable': true,
            'active': currentPage === maxPage,
            'clickHandler': function(j) {
                return function() {
                    changePage(j);
                };
            }(maxPage)
        });
        pagesArray.push({
            'label': 'vor >',
            'clickable': currentPage !== maxPage,
            'clickHandler': function() {
                if (currentPage !== maxPage) {
                    changePage(currentPage + 1)
                }
            }
        });
        return pagesArray;
    }


    var redrawTable = function(dataToBeShown) {
        // render in all divs passed
        self._divs.each(function() {
            // 'this' points to the div node
            var paginationData = preparePaginationMenu();

            var table = d3.select(this)
                .selectAll('table');

            if (table.empty()) {
                var table = d3.select(this).append('table')
                    .attr('class', 'table');
                // append a table head
                var theadTr = table.append('thead')
                    .append('tr');
                var theadTrEnter = theadTr.selectAll('th')
                    .data(columns)
                    .enter();
                theadTrEnter.append('th')
                    .attr('class', function(d, i) {
                        return d.type;
                    })
                    .classed('sortable', function(d, i) {
                        return d.sortable;
                    })
                    .append('div')
                    .on('click', function(d, i) {
                        if (d.sortable === true) {
                            reorder(i);
                        }
                    })
                    .append('span')
                    .text(function(d, i) {
                        return d.label;
                    });
                // add sorting icons
                var sortSpan = theadTr.selectAll('th').selectAll('div')
                    .append('span')
                    .attr('class', 'fa-stack');
                sortSpan.append('i')
                    .attr('class', 'fa fa-stack-1x fa-sort-asc');
                sortSpan.append('i')
                    .attr('class', 'fa fa-stack-1x fa-sort-desc');

                // append a table body
                table.append('tbody');
            }
            // set active (sorted) column in table class 
            table.selectAll('thead').selectAll('th')
                .classed('active', function(d, i) {
                    return i === sortColumn;
                });
            // display correct sorting icons
            table.selectAll('thead').selectAll('th i.fa-sort-desc')
                .classed('active', function(d, i) {
                    return i === sortColumn && !sortOrderAscending;
                });
            table.selectAll('thead').selectAll('th i.fa-sort-asc')
                .classed('active', function(d, i) {
                    return i === sortColumn && sortOrderAscending;
                });
            // enter actual table data
            var trData = table.selectAll('tbody').selectAll('tr')
                .data(dataToBeShown[0].values, function(d, i) {
                    return d['ID'];
                });
            // append new trs
            var trEnter = trData.enter().append('tr');
            // remove old trs
            var trExit = trData.exit().remove();

            var dateFormatter = locale.de_CH.timeFormat.utc('%x');
            var currencyFormatter =
                columns.forEach(function(d) {
                    // for each column, append a td
                    trEnter.append('td').attr('class', d.identifier.toLowerCase() + ' ' + d.type).append('div');
                    // update the text of the td
                    trData.selectAll('td.' + d.identifier.toLowerCase()).select('div')
                        .text(function(k) {
                            var text = '';
                            if (d.type === 'date') {
                                text = dateFormatter(k[d.identifier]);
                            } else if (d.type === 'currency') {
                                text = locale.fullVolumeCHF(k[d.identifier]);
                            } else {
                                text = k[d.identifier];
                            }
                            if (d.lookupTable) {
                                text = d.lookupTable[k[d.identifier]];
                            }
                            return text;
                        });
                });
            // sort the rows
            trData.sort(function(a, b) {
                a = a[columns[sortColumn].identifier];
                b = b[columns[sortColumn].identifier];
                if (columns[sortColumn].lookupTable) {
                    a = columns[sortColumn].lookupTable[a];
                    b = columns[sortColumn].lookupTable[b];
                }

                if (sortOrderAscending) {
                    if (columns[sortColumn].type !== 'string') {
                        return d3.ascending(a, b);
                    } else {
                        return a.correctLocaleCompare(b);
                    }
                } else {
                    if (columns[sortColumn].type !== 'string') {
                        return d3.descending(a, b);
                    } else {
                        return b.correctLocaleCompare(a);
                    }
                }
            });

            // draw pagination
            // <---- NEEDS TO BE MORE ELEGANT ---------->
            d3.select(this).selectAll('div.pagination-menu a').remove();

            var paginationMenuData = d3.select(this)
                .selectAll('div.pagination-menu')
                .data(['always']);

            var paginationMenuEnter = paginationMenuData.enter().append('div')
                .attr('class', 'pagination-menu');

            var paginationPagesData = paginationMenuData.selectAll('a')
                .data(paginationData, function(d, i) {
                    return d.label + i;
                });

            paginationPagesData.enter().append('a')
                .text(function(d, i) {
                    return d.label;
                });

            paginationPagesData.classed('clickable', function(d) {
                return d.clickable;
            });

            paginationPagesData.classed('active', function(d) {
                return d.active;
            });

            paginationPagesData.on('click', function(d) {
                d.clickHandler();
            });
            // <---- NEEDS TO BE MORE ELEGANT ---------->
        });
        console.log('table rerendered');
    }


    /* Public methods */
    self.render = function(divsToBeRenderedIn) {
        self._divs = divsToBeRenderedIn || self._divs;
        // prepare data
        currentData = self._dimension.top(Infinity);
        sortData();
        currentPage = 1;
        var dataToBeShown = currentData.filter(function(d) {
            return +d.key === currentPage;
        });
        if (dataToBeShown.length === 0) {
            dataToBeShown.push({
                values: []
            });
        }
        redrawTable(dataToBeShown);
    };

    self.columns = function(newColumns) {
        if (!arguments.length) {
            return columns;
        }
        columns = newColumns;
        return self;
    };
    self.rowsPerPage = function(newRowsPerPage) {
        if (!arguments.length) {
            return rowsPerPage;
        }
        rowsPerPage = newRowsPerPage;
        return self;
    };
}

/* 
 Histogram Class
 */
ui.elements.DraggableHistogram = function() {
    // call parent constructor
    ui.elements.ResettablePresentationElement.call(this);
    var self = this;
    /* Private variables */
    var margin = {
            top: 20,
            right: 15,
            bottom: 20,
            left: 15
        },
        barMargin = 1,
        xScale, // x scale,  gettable / setable
        yScale = d3.scale.linear(), // yscale , gettable / setable
        id = 0, // make dynamic
        xAxis = d3.svg.axis().orient('bottom'), // x-axis
        xAxisForMonths = d3.svg.axis().orient('bottom'), // x-axis
        yAxis = d3.svg.axis().orient('right'), // y-axis
        numberOfYAxisTicks = 3,
        brush = d3.svg.brush(), // brush
        round, // holds the rounding function for the brush (discrete extent only), gettable / setable
        tooltip = false;
    // the object to be returned
    var object = {};

    var extentMatchesDomain = function(roundedExtent) {
        var domain = (round) ? xScale.domain().map(round) : xScale.domain();
        // strings need to be compared as objects are never the same
        return roundedExtent[0].toString() === domain[0].toString() && roundedExtent[1].toString() === domain[1].toString();
    };

    brush.on('brush', function() {
        var g = d3.select(this.parentNode);
        var extent = brush.extent();
        if (round) {
            extent = extent.map(round);
        }

        // resize brush
        g.select('.brush')
            .call(brush.extent(extent))

        g.select('#clip-' + id + ' rect')
            .attr('x', xScale(extent[0]))
            .attr('width', xScale(extent[1]) - xScale(extent[0]));
        // if dirty === false, we can return now, as the dimension is already filtered
        if (!self._dirty && extentMatchesDomain(extent)) {
            return;
        } else if (extentMatchesDomain(extent)) {
            self._dimension.filterAll();
            self._current[self._currentDimension] = null;
            self._dirty = false;
        } else {
            self._dimension.filterRange(extent);
            // save extent
            self._current[self._currentDimension] = extent;
            self._dirty = true;
        }
        // trigger the filtering
        $(window).trigger('data.filtered');
    });

    /*var showTooltip = function(value, top, left) {
        self._divs.each(function() {
            var div = d3.select(this),
                currentTooltip = div.select('div.tooltip');

            currentTooltip
                .style('left', left + "px");
            currentTooltip.text(function() {
                return 'CHF ' + locale.abbrVolumeCHF(value)
            });


            var tooltipTop = parseInt(top) - $(currentTooltip.node()).height() + 10 + 'px';
            if (parseInt(tooltipTop) < 0) {
                tooltipTop = parseInt(top) + 80 + 'px';
            }
            currentTooltip.style('top', tooltipTop);

            currentTooltip.style('display', 'block');
        });
    };

    var hideTooltip = function() {
        self._divs.each(function() {
            var div = d3.select(this),
                currentTooltip = div.select('div.tooltip');

            // currentTooltip.style('display', 'none');
        });
    };*/
    /* Public methods */
    self.render = function(div) {
        if (self._current[self._currentDimension] !== undefined && self._current[self._currentDimension] !== null) {
            self._dirty = true;
        } else {
            self._dirty = false;
        }
        self._divs = div || self._divs;
        self._setTitle();

        self._divs.each(function() {

            var div = d3.select(this),
                g = div.select('g');
            // set range from enclosing div
            var widthOfEnclosingDiv = div.node().getBoundingClientRect().width + margin.left + margin.right;
            var heightOfEnclosingDiv = div.node().getBoundingClientRect().height - div.select('.title').node().getBoundingClientRect().height - 10;

            // set range of xScale
            xScale.range([0, widthOfEnclosingDiv - margin.right - margin.left]);

            // set range of yScale
            yScale.range([heightOfEnclosingDiv - margin.bottom - margin.top, 0]);

            // get width and height
            var width = xScale.range()[1],
                height = yScale.range()[0];

            // adaptive barwidth 
            var barWidth = (width - ((self._group.size() * barMargin * 2))) / self._group.size();
            yScale.domain([0, self._group.top(1)[0].value]);

            // apply xScale to brush and axis
            var parseDate = locale.de_CH.timeFormat('%Y').parse;

            brush.x(xScale);
            xAxis.scale(xScale);

            // prepare xAxis
            xAxis.tickValues([parseDate('2012')].concat(xScale.ticks(d3.time.years, 1).concat(parseDate('2015'))));
            xAxis.tickSize(4);

            // prepare xAxisForMonths
            xAxisForMonths.scale(xScale);
            xAxisForMonths.tickSize(2);
            xAxisForMonths.tickValues(xScale.ticks(d3.time.months, 1));
            xAxisForMonths.tickFormat(locale.de_CH.timeFormat('%b'));
            // apply yScale to yAxis
            yAxis.scale(yScale);
            // prepare yAxis
            yAxis.tickSize(0);
            yAxis.tickValues(yScale.ticks(numberOfYAxisTicks).slice(1)); // remove lowest value
            yAxis.tickFormat(locale.abbrVolumeCHF);
            // Create the skeletal chart.
            if (g.empty()) {
                g = div.append('svg')
                    .append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                // append background rect
                g.append('rect')
                    .attr('class', 'overallBackground');

                g.append('clipPath')
                    .attr('id', 'clip-' + id)
                    .append('rect');

                g.selectAll('.bars')
                    .data(['background', 'foreground'])
                    .enter().append('g')
                    .attr('class', function(d) {
                        return d + ' bars';
                    });

                g.selectAll('.bars')
                    .selectAll('rect')
                    .data(self._group.all())
                    .enter()
                    .append('rect')
                    .attr('y', margin.top);

                g.selectAll('.foreground.bars')
                    .attr('clip-path', 'url(#clip-' + id + ')');
                g.append('g')
                    .attr('class', 'x axis');
                g.append('g')
                    .attr('class', 'x axis months');
                g.append('g')
                    .attr('class', 'y axis');

                // Initialize the brush component with pretty resize handles.
                var gBrush = g.append('g').attr('class', 'brush').call(brush);

                // gBrush.selectAll('.resize').append('path').attr('d', resizePath);
                gBrush.selectAll('.resize').append('path')
                    .attr('class', 'cursor-line');

                gBrush.selectAll('.resize').append('circle')
                    .attr('class', 'cursor-handle')
                    .attr('r', 10);

                gBrush.selectAll('.resize').append('path')
                    .attr('class', 'cursor-handle-nubs')
                    .attr('d', 'M-4,-6V2M0,-6V2M4,-6V2');

                gBrush.selectAll('.resize').select('rect')
                    .attr('width', 20)
                    .attr('x', -10);

                // if tooltip, append tooltip skeleton
                /*               if (tooltip) {
                    tooltip = div.append('div')
                        .attr('class', 'tooltip')
                        .style('display', 'none');
                }
*/
            }
            // resize svg
            div.select('svg')
                .attr('width', width + margin.left + margin.right)
                .style('margin-left', -margin.left + 'px')
                .attr('height', height + margin.top + margin.bottom);

            // resize clipPath
            var extent = self._current[self._currentDimension] || brush.extent();
            g.select('#clip-' + id + ' rect')
                .attr('x', xScale(extent[0]))
                .attr('width', xScale(extent[1]) - xScale(extent[0]))
                .attr('height', height);

            // resize height of brush
            g.select('.brush').selectAll('rect')
                .attr('height', height);

            // resize extent and background of brush
            g.select('.brush').selectAll('rect.background')
                .attr('width', width);

            g.select('.brush').selectAll('rect.extent')
                .attr('x', xScale(extent[0]))
                .attr('width', xScale(extent[1]) - xScale(extent[0]));

            g.selectAll('.x.axis')
                .attr('transform', 'translate(0,' + height + ')');

            // resize position of handles
            g.select('.brush').selectAll('.resize.e')
                .attr('transform', 'translate(' + xScale(extent[1]) + ', 0)');
            g.select('.brush').selectAll('.resize.w')
                .attr('transform', 'translate(' + xScale(extent[0]) + ', 0)');

            // resize xAxis
            g.select('.x.axis')
                .call(xAxis);
            g.select('.x.axis.months')
                .call(xAxisForMonths);
            // resize yAxis
            g.select('.y.axis')
                .call(yAxis);

            // resize overallBackground
            g.select('rect.overallBackground')
                .attr('height', height + margin.top)
                .attr('transform', 'translate(0, -' + margin.top + ')')
                .attr('width', width);
            // resize brush handles
            g.select('.brush').selectAll('.resize circle.cursor-handle')
                .attr('transform', function(d, i) {
                    var translation = 'translate(0,' + ((i === 0) ? 0.8 * height : 0.2 * height) + ')';
                    return translation;
                });
            g.select('.brush').selectAll('.resize path.cursor-handle-nubs')
                .attr('transform', function(d, i) {
                    var translation = 'translate(0,' + (((i === 0) ? 0.8 * height : 0.2 * height) + 2) + ')';
                    return translation;
                });
            g.select('.brush').selectAll('.resize path.cursor-line')
                .attr('d', 'M0,' + -margin.top + 'V' + height);


            // resize bars
            g.selectAll('.bars')
                .selectAll('rect')
                .attr('x', function(d, i) {
                    return (i * barWidth) + ((2 * i + 1) * barMargin);
                })
                .attr('y', function(d) {
                    return yScale(d.value);
                })
                .attr('width', barWidth)
                .attr('height', function(d) {
                    return (height - yScale(d.value) - 2) < 0 ? 0 : (height - yScale(d.value) - 2);
                });

            // resize brush
            g.select('.brush')
                .call(brush.extent(extent));
            // needed at the beginning only and when resetting the chart
            // programmatically sets the extent of the chart
            if (!self._dirty) {
                brush.extent(xScale.domain());
                var extent = brush.extent();
                // set brush programmaticaly
                brush.event(g.selectAll('.brush'));
                // set clipping mask
                g.selectAll('#clip-' + id + ' rect')
                    .attr('x', xScale(extent[0]))
                    .attr('width', xScale(extent[1]) - xScale(extent[0]));
            }

            // add some custom styles to y axis
            var rectLeftMargin = 10;
            g.select('.y.axis').selectAll('.tick')
                .selectAll('rect.shadow')
                .remove();
            g.select('.y.axis').selectAll('.tick').select('text')
                .attr('x', rectLeftMargin + rectLeftMargin / 2);
            g.select('.y.axis').selectAll('.tick')
                .insert('rect', 'text')
                .attr('x', rectLeftMargin)
                .attr('y', -8)
                .attr('width', function(d, i) {
                    var width = d3.select(this.parentNode).node().getBoundingClientRect().width
                        // var length = locale.abbrVolumeCHF(d).trim().length;
                    return width + 8;
                })
                .attr('height', 16)
                .attr('class', 'shadow');
            // add grid lines
            g.select('.y.axis').selectAll('line.horizontalGrid').remove();
            g.select('.y.axis').selectAll('line.horizontalGrid').data(yScale.ticks(numberOfYAxisTicks).slice(1)).enter()
                .append('line')
                .attr({
                    'class': 'horizontalGrid',
                    'x2': width,
                    'x1': function(d, i) {
                        return d3.select(this.parentNode).selectAll('.tick')[0][i].getBoundingClientRect().width + rectLeftMargin;
                    },
                    'y1': function(d) {
                        return yScale(d);
                    },
                    'y2': function(d) {
                        return yScale(d);
                    }
                });
            // hook tooltip
            /*g.selectAll('.foreground rect')
                .on('mouseover', function(d, i) {
                    if (tooltip) {
                        // get position of bar
                        var top = d3.select(this).attr('y');
                        showTooltip(d.value, top, (i * barWidth) + ((2 * i + 1) * barMargin));
                    }
                })
                .on('mouseout', function(d) {
                    if (tooltip) {
                        hideTooltip();
                    }
                });*/
        });
    };

    self.margin = function(newMargin) {
        if (!arguments.length) return margin;
        margin = newMargin;
        return self;
    };

    self.xScale = function(newXScale) {
        if (!arguments.length) return x;
        xScale = newXScale;
        return self;
    };

    self.yScale = function(newYScale) {
        if (!arguments.length) return yScale;
        yScale = newYScale;
        return self;
    };

    self.round = function(newRound) {
        if (!arguments.length) return round;
        round = newRound;
        return self;
    };

    self.tooltip = function(newTooltip) {
        if (!arguments.length) {
            return tooltip;
        }
        tooltip = newTooltip;
        return self;
    };
}

/* 
Searchable Barchart Class
*/
ui.elements.SearchableBarchart = function() {
    // call parent constructor
    ui.elements.ResettablePresentationElement.call(this);
    var self = this;
    /* Private variables */
    var margin = {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        xScale = d3.scale.linear(), // x scale
        numberOfGroups, // the number of groups to be shown
        heightOfBar = 30,
        bottomMarginOfBar = 2,
        tooltipFunction = null;

    /* public variables */
    self._lookupTable = null;
    self._lookupTableForSuperscript = null;
    self._lookupTableForTooltip = null;
    // the object to be returned
    var object = {};

    // prepare search field
    var prepareSearchfield = function(listOfOthers) {
        function search(value) {
            var results = listOfOthers.filter(function(d, i) {
                var lookup = self._lookupTable ? self._lookupTable[d.key] : d.key;
                return value !== "" && lookup.toLowerCase().startsWith(value.toLowerCase());
            });
            return results;
        };

        var processInput = function(input) {
            var list = (input !== '') ? search(input) : listOfOthers;
            // list = list.slice(0, 9); // show a maximum of 10 entries
            displayList(list, input);
        };

        function displayList(list, input) {
            self._divs.each(function() {
                var div = d3.select(this),
                    searchFieldDiv = div.select('div.searchFieldContainer');
                var resultDivs = searchFieldDiv.select('.resultList')
                    .selectAll('.result')
                    .data(list, function(d, i) {
                        return d.key;
                    });
                resultDivs.enter().append('div')
                    .attr('class', 'result');
                resultDivs.exit().remove();
                resultDivs
                    .html(function(d, i) {
                        var value = self._lookupTable ? self._lookupTable[d.key] : d.key;
                        value += self._lookupTableForSuperscript ? '<sup>' + self._lookupTableForSuperscript[d.key] + '</sup>' : '';
                        var boldText = value.substr(0, input.length);
                        var notBoldText = value.substr(input.length);
                        return '<strong>' + boldText + '</strong>' + notBoldText;
                    })
                    // need to use mousedown instead of click, because if we use click, blur is fired first
                    .on('mousedown', function(d, i) {
                        console.log('click event fired');
                        // set filter and trigger event
                        self._dimension.filterExact(d.key);
                        self._current[self._currentDimension] = d.key;
                        // hide search field
                        hideSearchfield();
                        $(window).trigger('data.filtered');
                    });
                // sort
                resultDivs.sort(function(a, b) {
                    a = self._lookupTable ? self._lookupTable[a.key] : a.key;
                    b = self._lookupTable ? self._lookupTable[b.key] : b.key;
                    return a.correctLocaleCompare(b);
                });
                if (list.length === 0) {
                    searchFieldDiv.select('.resultList')
                        .style('display', 'none');
                } else {
                    searchFieldDiv.select('.resultList')
                        .style('display', 'block');
                }
            });
        };
        self._divs.each(function() {
            var div = d3.select(this),
                searchFieldDiv = div.select('div.searchFieldContainer');
            // empty list
            // empty input field
            $(searchFieldDiv.select('input').node()).val('');
            searchFieldDiv.select('input')
                .on('input', function() {
                    processInput($(this).val());
                })
                .on('focus', function() {
                    processInput('');
                })
                .on('blur', function() {
                    console.log('blur event fired');
                    $(this).val('');
                    hideSearchfield();
                });
        });
    };
    // show search field
    var showSearchfield = function() {
        self._divs.each(function() {
            var div = d3.select(this),
                searchField = div.select('div.searchFieldContainer');
            searchField.style('display', 'block');
            $(searchField.select('input').node()).focus();
        });
    };
    // hide search field
    var hideSearchfield = function() {
        // alert('hidden');
        self._divs.each(function() {
            var div = d3.select(this),
                searchField = div.select('div.searchFieldContainer');
            // searchField.select('.resultList').selectAll('.result').remove();
            searchField.style('display', 'none');
        });
    };

    var hideTooltip = function() {
        self._divs.each(function() {
            var div = d3.select(this),
                currentTooltip = div.select('div.tooltip');

            currentTooltip.style('display', 'none');
        });
    };

    var redrawChart = function(dataToBeShown) {
        self._setTitle();
        self._divs.each(function() {
            // if, for some reason, tooltip is still shown, hide (relevant for mobile devices)
            var div = d3.select(this),
                container = div.select('div.chartContainer');

            var widthOfEnclosingDiv = div.node().getBoundingClientRect().width;

            // set range of xScale
            xScale.range([0, widthOfEnclosingDiv - margin.right - margin.left]);
            // set domain of xScale
            var maxValue = d3.max([(dataToBeShown['topGroups'][0] !== undefined) ? dataToBeShown['topGroups'][0].value : 0, (dataToBeShown['others'][0] !== undefined) ? dataToBeShown['others'][0].value : 0]);
            xScale.domain([0, maxValue]);
            var width = xScale.range()[1];
            // dynamically calculate height based on number of bars to display
            var height = (numberOfGroups + 1) * heightOfBar + (numberOfGroups + 1) * bottomMarginOfBar;

            if (container.empty()) {
                container = div.append('div')
                    .attr('class', 'chartContainer')
                    .style('left', margin.left + 'px')
                    .style('top', margin.top + 'px')
                    .style('height', height + margin.top + margin.bottom + 'px');

                // append searchfield
                var searchFieldContainer = container.append('div')
                    .attr('class', 'searchFieldContainer')
                    .style('display', 'none')
                    .style('top', function(d, i) {
                        var y = numberOfGroups * (heightOfBar + bottomMarginOfBar);
                        return y + 'px';
                    });
                searchFieldContainer
                    .append('div')
                    .attr('class', 'inputContainer')
                    .style('height', heightOfBar + 'px')
                    .append('input')
                    .attr('type', 'text')
                searchFieldContainer.select('.inputContainer')
                    .append('i')
                    .attr('class', 'fa fa-search');
                searchFieldContainer.append('div')
                    .attr('class', 'resultList');
            }

            // prepare search field
            if (dataToBeShown['listOfOthers'].length > 0) {
                prepareSearchfield(dataToBeShown['listOfOthers']);
            }
            // resize svg
            div.select('div.chartContainer')
                .style('width', width + margin.left + margin.right + 'px');

            var bars = container.selectAll('.normalBar')
                .data(dataToBeShown['topGroups'], function(d, i) {
                    return d.key;
                });
            var searchBar = container.selectAll('.searchBar')
                .data(dataToBeShown['others'], function(d, i) {
                    return d.key;
                });

            // exit
            bars.exit().remove();
            searchBar.exit().remove();

            // enter group
            // normal bars
            var barEnter = bars.enter().append('div')
                .attr('class', 'normalBar bar')
                .on('tap', function(d) {
                    self._dimension.filterExact(d.key);
                    self._current[self._currentDimension] = d.key;
                    self._dirty = true;
                    // trigger the filtering
                    $(window).trigger('data.filtered');
                })
                .on('mouseover', function(d) {
                    if (tooltipFunction) {
                        // get position of bar
                        var top = d3.select(this).style('top');
                        tooltipFunction.call(self, d.key, d.value, top, width);
                    }
                })
                .on('mouseout', function(d) {
                    if (tooltipFunction) {
                        hideTooltip();
                    }
                });
            // search bar
            var searchBarEnter = searchBar.enter().append('div')
                .attr('class', 'searchBar bar')
                .on('mouseover', function(d) {
                    if (tooltipFunction && d.key !== 'Andere') {
                        // get position of bar
                        var top = d3.select(this).style('top');
                        tooltipFunction.call(self, d.key, d.value, top, width);
                    }
                })
                .on('tap', function(d) {
                    showSearchfield();
                })
                .on('mouseout', function(d) {
                    if (tooltipFunction && d.key !== 'Andere') {
                        hideTooltip();
                    }
                });
            // 
            // background rect
            barEnter
                .append('div')
                .attr('class', 'background')
                .style('height', heightOfBar + 'px');
            // foreground rect
            barEnter
                .append('div')
                .attr('class', 'foreground')
                .style('height', heightOfBar + 'px');
            // text
            barEnter
                .append('span')
                .style('top', heightOfBar / 2 - 7 + 'px')
                .style('left', 10 + 'px')
                .html(function(d, i) {
                    var html = self._lookupTable ? self._lookupTable[d.key] : d.key;
                    html += self._lookupTableForSuperscript ? '<sup>' + self._lookupTableForSuperscript[d.key] + '</sup>' : '';
                    return html;
                });
            // background rect
            searchBarEnter
                .append('div')
                .attr('class', 'background')
                .style('height', heightOfBar + 'px');

            // foreground rect
            searchBarEnter
                .append('div')
                .attr('class', 'foreground')
                .style('height', heightOfBar + 'px');
            // text
            searchBarEnter
                .append('span')
                .style('top', heightOfBar / 2 - 7 + 'px')
                .style('left', 10 + 'px')
                .html(function(d, i) {
                    var html = self._lookupTable ? self._lookupTable[d.key] : d.key;
                    html += self._lookupTableForSuperscript ? '<sup>' + self._lookupTableForSuperscript[d.key] + '</sup>' : '';
                    return html;
                });
            // Looking glass
            searchBarEnter
                .append('i')
                .attr('class', 'fa fa-search');
            // update
            bars
                .classed('first-child', function(d, i) {
                    return i === 0 && d.value >= maxValue;
                })
                .style('top', function(d, i) {
                    var y = i * (heightOfBar + bottomMarginOfBar);
                    return y + 'px';
                });
            searchBar
                .style('top', function(d, i) {
                    var y = numberOfGroups * (heightOfBar + bottomMarginOfBar);
                    return y + 'px';
                });
            // resize 
            var allBars = container.selectAll('.bar');
            allBars.style('width', width + 'px');
            allBars.selectAll('div')
                .style('position', 'absolute');
            allBars.select('div.background')
                .style('width', width + 'px');
            allBars.select('div.foreground')
                .style('width', function(d, i) {
                    return xScale(d.value) + 'px';
                });
            allBars.select('span')
                .style('width', width - 20 + 'px');
            allBars.selectAll('div')
                .classed('active', function(d) {
                    return (d.key === self._current[self._currentDimension]);
                });
            container.select('.searchFieldContainer')
                .style('width', width + 'px');
            container.select('.searchFieldContainer').select('input')
                .style('width', width - 40 + 'px');

        });
    };

    /* Public methods */
    self.render = function(divsToBeRenderedIn) {
        self._divs = divsToBeRenderedIn || self._divs;
        // 
        if (self._current[self._currentDimension] !== undefined && self._current[self._currentDimension] !== null) {
            self._dirty = true;
        } else {
            self._dirty = false;
        }

        // prepare data
        var currentData = self._group.top(Infinity);

        // console.log(currentData);
        var dataToBeShown = currentData.filter(function(d) {
            return d.value > 0;
        });
        // console.log(dataToBeShown);
        var topGroups = dataToBeShown.slice(0, numberOfGroups);
        var rest = dataToBeShown.slice(numberOfGroups);
        if (rest.length > 0) {
            var other = {};
            other['key'] = 'Andere';
            other['value'] = _.reduce(rest, function(sum, n) {
                return sum + parseFloat(n['value']);
            }, 0);
            // if currently selected is not among top numberOfGroups but among rest, replace 'Andere' with this country
            if (self._dirty) {
                // check if is contained in top groups
                var isContained = _.some(topGroups, {
                    'key': self._current[self._currentDimension]
                });
                if (!isContained) {
                    // search rest for this country
                    var country = rest.filter(function(d, i) {
                        return d.key === self._current[self._currentDimension];
                    });
                    // if it is actually contained in rest, replace other with this country
                    if (country.length > 0) {
                        other = country[0];
                    }
                }
            }
        }
        var dataToBeShown = {};
        dataToBeShown['topGroups'] = topGroups;
        if (dataToBeShown['topGroups'].length === 0) {
            dataToBeShown['topGroups'] = [];
        }
        if (other !== undefined) {
            dataToBeShown['others'] = [other];
            dataToBeShown['listOfOthers'] = rest;
        } else {
            dataToBeShown['others'] = [];
            dataToBeShown['listOfOthers'] = [];
        }
        // hide search field
        // hideSearchfield();
        // draw chart
        redrawChart(dataToBeShown);
    };

    self.numberOfGroups = function(newNumberOfGroups) {
        if (!arguments.length) {
            return numberOfGroups;
        }
        numberOfGroups = newNumberOfGroups;
        return self;
    };

    self.lookupTable = function(newLookupTable) {
        if (!arguments.length) {
            return self._lookupTable;
        }
        self._lookupTable = newLookupTable;
        return self;
    };
    self.lookupTableForSuperscript = function(newLookupTableForSuperscript) {
        if (!arguments.length) {
            return self._lookupTableForSuperscript;
        }
        self._lookupTableForSuperscript = newLookupTableForSuperscript;
        return self;
    };

    self.lookupTableForTooltip = function(newLookupTableForTooltip) {
        if (!arguments.length) {
            return self._lookupTableForTooltip;
        }
        self._lookupTableForTooltip = newLookupTableForTooltip;
        return self;
    };

    self.tooltipFunction = function(newTooltipFunction) {
        if (!arguments.length) {
            return tooltipFunction;
        }
        tooltipFunction = newTooltipFunction;
        return self;
    };
};

ui.elements.FilterButton = function() {
    var label = '';
    var divs = null;
    var filterFunction = null;
    var current = null;
    var self = this;
    var filters = null;
    var dimensions = null;

    var isEnabled = function() {
        return _.all(filters, function(d, i) {
            if (d.type === 'extent') {
                // array comparison
                if (current[d.label] !== undefined && current[d.label] !== null) {
                    if (d.value === null) {
                        return false;
                    }
                    return _.all(d.value, function(k, j) {
                        return k.toString() === current[d.label][j].toString();
                    })
                } else {
                    return d.value === null;
                }
            }
            return d.value == current[d.label];
        });
    };
    self.render = function(divsToBeRenderedIn) {
        divs = divsToBeRenderedIn || divs;
        divs.each(function() {
            var div = d3.select(this),
                h1 = div.select('h1');
            if (h1.empty()) {
                h1 = div.append('h1');
                h1.text(label);
            }
            div.on('click', function() {
                    // set filters, but only if is not yet enabled (disallow user to filter multiple times)
                    if (!isEnabled()) {
                        filters.forEach(function(d, i) {
                            if (d.value === null) {
                                dimensions[d.label].filterAll();
                                current[d.label] = null;
                            } else {
                                if (d.type === 'extent') {
                                    dimensions[d.label].filterRange(d.value);
                                } else if (d.type === 'exact') {
                                    dimensions[d.label].filterExact(d.value);
                                }
                                current[d.label] = d.value;
                            }
                        });
                        $(window).trigger('data.filtered');
                    }
                })
                .classed('active', function() {
                    // pairwise comparison
                    return isEnabled();
                });
        });
    };

    self.filterFunction = function(newFilterFunction) {
        if (!arguments.length) {
            return filterFunction;
        }
        filterFunction = newFilterFunction;
        return self;
    };

    self.current = function(newCurrent) {
        if (!arguments.length) {
            return current;
        }
        current = newCurrent;
        return self;
    };

    self.filters = function(newFilters) {
        if (!arguments.length) {
            return filters;
        }
        filters = newFilters;
        return self;
    };

    self.label = function(newLabel) {
        if (!arguments.length) {
            return label;
        }
        label = newLabel;
        return self;
    };
    self.dimensions = function(newDimensions) {
        if (!arguments.length) {
            return dimensions;
        }
        dimensions = newDimensions;
        return self;
    };
}

/* SERVER */
server.loadData = function() {
    var id = 0;
    queue(3)
        .defer(d3.csv, 'data/exports.csv', function(d) {
            var dateParser = locale.de_CH.timeFormat.utc('%Y-%m-%d');
            d['ID'] = id++; // generate unique id at load time
            d['Wert'] = +d['Wert'];
            d['Datum'] = dateParser.parse(d['Datum']);
            d['VerzeichnisHaupttyp'] = d['Verzeichnis'] + d['Haupttyp'];
            // d['Datum'].setHours(d['Datum'].getHours() + 1); // correct for UTC+1
            return d;
        })
        .defer(d3.csv, 'data/export_directories.csv', function(d) {
            return d;
        })
        .defer(d3.csv, 'data/export_categories.csv', function(d) {
            d['VerzeichnisHaupttyp'] = d['Verzeichnis'] + d['Haupttyp']
            return d;
        })
        .await(function(error, exports, export_directories, export_categories) {
            if (error !== undefined && error !== null) {
                console.log(error);
            }

            // generate lookup tables
            data.lookup = {};
            data.lookup.category = {};
            data.lookup.category_examples = {};
            export_categories.forEach(function(d) {
                data.lookup.category[d['VerzeichnisHaupttyp']] = d['Beschreibung'];
                data.lookup.category_examples[d['VerzeichnisHaupttyp']] = d['Beispiele'];
            });
            data.lookup.directory = {};

            // exports = exports.slice(0, 20);
            exports = crossfilter(exports);
            export_categories.forEach(function(d) {
                var letter = '';
                if (d['Verzeichnis'] === '5.1' || d['Verzeichnis'] === '5.2' || d['Verzeichnis'] === 'ChKV' || d['Verzeichnis'] === 'unbekannt') {
                    letter = 'C';
                } else if (d['Verzeichnis'] === 'GKV') {
                    letter = 'A';
                } else if (d['Verzeichnis'] === 'ML (GKV)') {
                    letter = 'B';
                }
                data.lookup.directory[d['VerzeichnisHaupttyp']] = letter;
            });
            // add andere
            data.lookup.directory['Andere'] = '';
            data.lookup.category['Andere'] = 'Andere';
            var returnWert = function(d) {
                return Math.round(d['Wert']);
            };
            data.dimensions = {};
            data.groups = {};

            // Dimension: Datum
            data.dimensions.date = exports.dimension(function(d) {
                return d['Datum']
            });
            data.groups.months = data.dimensions.date.group(d3.time.month);
            data.groups.months.reduceSum(returnWert);

            // Dimension: Land
            data.dimensions.country = exports.dimension(function(d) {
                return d['Land']
            });
            data.groups.country = data.dimensions.country.group();
            data.groups.country.reduceSum(returnWert);

            // Dimension: Güterkategorie
            data.dimensions.category = exports.dimension(function(d) {
                return d['VerzeichnisHaupttyp']
            });
            data.groups.category = data.dimensions.category.group();
            data.groups.category.reduceSum(returnWert);

            // make data a global object
            // data.exports = exports;

            console.log('server.dataLoaded fired');
            $(window).trigger('server.dataLoaded');
        });
}
