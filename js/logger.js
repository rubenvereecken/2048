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

(function(console){

  console.save = function(data, filename){

    if(!data) {
      console.error('Console.save: No data')
      return;
    }

    if(!filename) filename = 'console.json'

    if(typeof data === "object"){
      data = JSON.stringify(data, undefined, 4)
    }

    var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')

    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
  }
})(console);
