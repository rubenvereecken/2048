(function(__console) {
  __console.old = {
    log: __console.log.bind(console),
    debug: __console.debug.bind(console),
    error: __console.error.bind(console),
    info: __console.info.bind(console)
  };

  var $el = $('#logger');

  var scrollToBottom = function() {
    $('#logger').scrollTop($('#logger')[0].scrollHeight);
  };

  __console.log = function(msg) {
    __console.old.log(msg);
    if (_.isObject(msg)) {
      msg = 'OBJ ' + Object.keys(msg);
    }

    $el.append('LOG  : ' + msg + '\n');
    scrollToBottom();
  };

  __console.debug = function(msg) {
    __console.old.debug(msg);
    if (_.isObject(msg)) {
      msg = 'OBJ ' + Object.keys(msg);
    }

    scrollToBottom();
    $el.append('DEBUG: ' + msg + '\n');
  };

  __console.error = function(msg) {
    __console.old.error(msg);
    if (_.isObject(msg)) {
      msg = 'OBJ ' + Object.keys(msg);
    }

    scrollToBottom();
    $el.append('ERROR: ' + msg + '\n');
  };

  __console.info = function(msg) {
    __console.old.info(msg);
    if (_.isObject(msg)) {
      msg = 'OBJ ' + Object.keys(msg);
    }

    scrollToBottom();
    $el.append('INFO : ' + msg + '\n');
  };
})(console);



