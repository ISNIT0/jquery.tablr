(function ($) {
    $.fn.tablr = function (opts) {
        var debounce = function (func, wait, immediate) {
            var timeout;
            return function () {
                var context = this, args = arguments;
                var later = function () {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        };
        var defaults = { //Setup defaults
            data: false,
            origin: '',
            blacklist: [],
            whitelist: [],
            key: '',
            order: 1,
            offset: 0,
            max: 10,
            filters: true,
            filter: {},
            keys: {},
            middleware: function (data) { return data; }
        };
        opts = $.extend(defaults, opts); //Extend defaults
        var table = this.addClass('tablr');
        whyDoINeedThis = {
            'object': function () {
                if (!opts.origin) opts.origin = opts.data;
                opts.data = opts.data.sort(function (a, b) { //Sort data based on user's key
                    if ((a[opts.sort] || '') < (b[opts.sort] || '')) return opts.order * -1;
                    if ((a[opts.sort] || '') > (b[opts.sort] || '')) return opts.order;
                    return 0;
                });
                var keys = (opts.whitelist.length && opts.whitelist) || opts.data.map(function (val) { //Find all keys
                    return Object.keys(val);
                }).reduce(function (a, b) { //Flatten 2D array
                    return a.concat(b);
                }).sort().filter(function (a, b, c) { //Remove Duplicates
                    return a != c[b - 1];
                }).filter(function (a, b, c) { //Remove non relevent
                    return (opts.blacklist.indexOf(a) == -1 && //Remove Blacklisted
                            !(opts.whitelist.length && opts.whitelist.indexOf(a) == -1)); //Keep Whitelisted
                });


                $(table).html('').append([
                  $('<div>').addClass('tablr-row').append(
                    keys.map(function (val) {
                        return $('<div>').addClass('tablr-col').html(opts.keys[val] || val).click(function () {
                            opts.sort = val;
                            opts.order = opts.order * -1;
                            opts.data = opts.origin;
                            table.tablr(opts);
                        })
                    })
                  ),
                  $('<div>').addClass('tablr-row').append(
                    keys.filter(function () { return opts.filters }).map(function (val) {
                        return $('<div>').addClass('tablr-col').append(
                          $('<input>').addClass('filter').attr({
                              placeholder: 'Search...',
                              'data-field': val,
                              value: (opts.filter || {})[val]
                          }).on('keyup', debounce(function () {
                              table.find('.filter').toArray().map(function (val) {
                                  opts.filter[$(val).attr('data-field')] = $(val).val().toLowerCase();
                                  opts.data = opts.origin;
                                  table.tablr(opts);
                              });
                              table.tablr(opts);
                          }, 300))
                        )
                    })
                  ), function () {
                      var data = opts.data.filter(function (value) {
                          return Object.keys(value).map(function (val) { !opts.filter[val] && delete opts.filter[val]; return val }).filter(function (key) {
                              return (!Object.keys(opts.filter).length || (value[key] || 0).toString().toLowerCase().indexOf(opts.filter[key] || null) + 1);
                          }).length;
                      }).slice(opts.origin.constructor == String ? 0 : opts.offset, opts.origin.constructor == String ? opts.max : opts.offset + opts.max).map(function (data) {
                          return $('<div>').addClass('tablr-row').append(
                            keys.map(function (key) {
                                return $('<div>').addClass('tablr-col').html(data[key]);
                            })
                          )
                      });
                      if (data.length) {
                          return data.reduce(function (a, b) {
                              return $(a).toArray().concat($(b).toArray())
                          })
                      } else {
                          return data
                      }
                  }(),
                  $('<div>').addClass('tablr-buttons').append(
                    Array.apply(null, Array(opts.totalPages || opts.data.length)).map(function (val, index) {
                        var page = Math.ceil(opts.offset / opts.max);
                        return $('<button>').addClass('paging').addClass(function () {
                            if (index == page)
                                return 'selected';
                            else if (index == page - 3) {
                                index = page - 1;
                                return 'left';
                            } else if (index == page + 3) {
                                index = page + 1
                                return 'right';
                            }
                        }).text(index + 1).click(function () {
                            opts.offset = opts.max * index;
                            opts.data = opts.origin;
                            table.tablr(opts);
                        }).toggle(index > page - 4 && index < page + 4);
                    })
                  )
                ]);
            }, 'string': function () {
                opts.origin = opts.data;
                $.getJSON(opts.origin, {
                    page: Math.ceil((opts.offset / opts.max)),
                    max: opts.max,
                    sort: opts.sort,
                    order: opts.order,
                    filter: JSON.stringify(Object.keys(opts.filter).map(function (val) { return [val, opts.filter[val]] }))
                }, function (data) {
                    if (!data.length)
                        console.log('No data recieved from server, ', opts.data);
                    else {
                        opts.data = opts.middleware(JSON.parse(data).Data);
                        opts.totalPages = JSON.parse(data).Pages
                        table.tablr(opts)
                    }
                });
            }, 'undefined': function () {
                return;
            }
        }[typeof opts.data]();
        return this;
    }
})(jQuery);
