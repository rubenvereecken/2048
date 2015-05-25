(function(__console) {
  __console.old = {
    log: __console.log.bind(console),
    debug: __console.debug.bind(console)
  };

  var $el = $('#logger');

  var scrollToBottom = function() {
    $('#logger').scrollTop($('#logger')[0].scrollHeight);
  }

  __console.log = function(msg) {
    if (_.isObject(msg)) {
      msg = 'OBJ ' + Object.keys(msg);
    }

    $el.append('LOG  : ' + msg + '\n');
    scrollToBottom();
    __console.old.log(msg);
  };

  __console.debug = function(msg) {
    if (_.isObject(msg)) {
      msg = 'OBJ ' + Object.keys(msg);
    }

    scrollToBottom();
    $el.append('DEBUG: ' + msg + '\n');
    __console.old.debug(msg);
  }
})(console);



