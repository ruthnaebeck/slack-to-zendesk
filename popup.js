"use strict";
/* global chrome */

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };
  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url);
  });
}

function zendeskPaste() {
  var x = document.getElementsByClassName('editor zendesk-editor--rich-text-comment')[0];
  var node = document.createElement('p');
  var textnode = document.createTextNode('Added with code');
  node.appendChild(textnode);
  x.appendChild(node);
  console.log('Zendesk Paste Complete!')
}

function renderHTML(value) {
  document.getElementById('slackZendesk').innerHTML = value;
}

document.addEventListener('DOMContentLoaded', function() {
  getCurrentTabUrl(function(url) {
    if(url.indexOf('datadog.zendesk.com/agent/tickets') > -1){
      renderHTML('Pasted');
    }else{
      renderHTML('Page Not Supported');
    }
  });
});
