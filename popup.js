'use strict';
/* global chrome slackRawText */

var slackRawText = '';

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };
  chrome.tabs.query(queryInfo, function (tabs) {
    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url);
  });
}

function slackCopy() {
  var reg = /\[.*ago\]/g
  chrome.tabs.executeScript(null,
    {code: `
      var slackParsedText = window.getSelection().toString();
      slackParsedText = slackParsedText.replace(${reg}, '<br>')
      chrome.storage.local.set({ 'slackParsedText':  slackParsedText})
      console.log(slackParsedText)
    `});
  setTimeout(function(){
    window.close();
  }, 2000);
}

function zendeskPaste() {
  chrome.tabs.executeScript(null,
    {code: `
      chrome.storage.local.get('slackParsedText', function (result) {
        console.log(result.slackParsedText)
        var x = document.getElementsByClassName('editor zendesk-editor--rich-text-comment')[0];
        var node = document.createElement('p');
        var textnode = document.createTextNode(result.slackParsedText);
        node.appendChild(textnode);
        x.appendChild(node);
        console.log('Zendesk Paste Complete!')
      });
    `});
  setTimeout(function(){
    window.close();
  }, 2000);
}

function renderHTML(value) {
  document.getElementById('slackZendesk').innerHTML = value;
}

document.addEventListener('DOMContentLoaded', function () {
  getCurrentTabUrl (function (url) {
    if (url.indexOf('dd.slack.com') > -1) {
      slackCopy()
      renderHTML('Copied')
    } else if (url.indexOf('datadog.zendesk.com/agent/tickets') > -1) {
      zendeskPaste()
      renderHTML('Pasted');
    } else {
      renderHTML('Page Not Supported');
    }
  });
});
