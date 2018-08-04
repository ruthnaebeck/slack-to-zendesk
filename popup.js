'use strict';
/* global chrome slackRawText */

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
  var regTime = /\[.*ago\]/g;
  var newLine = /\r?\n/;
  chrome.tabs.executeScript(null,
    {code: `
      var slackParse = window.getSelection().toString().split(${newLine}).map(item => {return item.trim()})
      var i = 0;
      while (i < slackParse.length) {
        if (${regTime}.test(slackParse[i]))
          slackParse.splice(i, 1);
        else
          i++;
      }
      chrome.storage.local.set({'slackParse': slackParse})
      console.log(slackParse)
    `});
  setTimeout(function(){
    window.close();
  }, 2000);
}

function zendeskPaste() {
  chrome.tabs.executeScript(null,
    {code: `
      chrome.storage.local.get('slackParse', function (result) {
        console.log(result.slackParse)
        var x = document.getElementsByClassName('editor zendesk-editor--rich-text-comment')[0];
        var node = document.createElement('p');
        var textnode = document.createTextNode(result.slackParse);
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
