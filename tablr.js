(function($){
  $.fn.resizeTablr = function () {
    $('.tablr').each(function (index, element) {
      if ($(element).find('.tablr-col').eq(0).width() < minThresh) {
        $(element).find('.tablr-row').each(function (index, val) {
          $(val).find('.notimportant:visible').last().hide()
        })
        if ($(element).find('.tablr-col').eq(0).width() < minThresh) {
          $(element).find('.tablr-row').each(function (index, val) {
            $(val).find('.tablr-col:not(.important):visible').last().hide()
          })
        }
      } else if ($(element).find('.tablr-col').eq(0).width() > maxThresh) {
        $(element).find('.tablr-row').each(function (index, val) {
          $(val).find('.tablr-col:not(:visible):not(.notimportant)').first().show()
        });
        if ($(element).find('.tablr-col').eq(0).width() > maxThresh) {
          $(element).find('.tablr-row').each(function (index, val) {
            $(val).find('.tablr-col:not(:visible)').first().show()
          })
        }
      }
        });
  };

  $.fn.renderTable = function (passed, key, order, offset, max, keys) {
    order = order || 0;
    offset = offset || 0;
    max = max || 10;
    minThresh = 130;
    maxThresh = 170;
    table = this;
    haveData = function (data, totalPages) {
      data = data.sort(function (a, b) {
        if ((a[key] || '') < (b[key] || '')) return order * -1;
        if ((a[key] || '') > (b[key] || '')) return order;
        return 0;
      })
      keys = keys || data.map(function (val) {
        return Object.keys(val);
      }).reduce(function (a, b) {
        return a.concat(b);
      }).sort().filter(function (a, b, c) {
        return a != c[b - 1]
      })
      table.addClass('tablr').html('').append([
        $('<div>').addClass('tablr-row').append(
          keys.map(function (val) {
            return $('<div>').addClass('tablr-col').html(val).click(function () {
              table.renderTable(passed, val, order * -1, offset, max, keys)
            })
          })
        ),
        data.slice(0, max).map(function (data) {
          return $('<div>').addClass('tablr-row').append(
            keys.map(function (val) {
              return $('<div>').addClass('tablr-col').html(data[val]);
            })
          )
        }).reduce(function (a, b) {
          return $(a).toArray().concat($(b).toArray())
        }),
        $('<div>').addClass('buttons').append(
          Array.apply(null, Array(totalPages)).map(function (val, index) {
            var page = Math.ceil(offset / max);
            var button = $('<button>').addClass('paging').addClass(function () {
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
              table.renderTable(passed, key, order, max * index, max, keys)
            })
            if(!(index > page - 4 && index < page + 4)) button.hide();
            return button;
          })
        )
      ]);
      //$('.myTable').resizeTablr();
    }
    console.log(passed)
    if(passed) if (Array.isArray(passed))
      haveData(passed, Math.ceil(passed.length/max))
      else
      $.getJSON(passed,
                {
                  page: Math.ceil(offset / max),
                  max: max,
                  sort: key,
                  order: order
                },
                function (res, a) {
                  if (res) {
                    res = JSON.parse(res);
                    haveData(res,Math.ceil(res.length/max));
                  } else {
                    console.log('TABLR: Got', res, 'from server');
                  }
                }
               )
      return true;
      }
})(jQuery);
