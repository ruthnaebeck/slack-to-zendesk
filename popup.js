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
  var regNewLine = /\r?\n/;
  var regEmoji = /:\S*:/g;
  var regEdited = /\(edited\)/g;
  chrome.tabs.executeScript(null,
    {code: `
      var slackParse = window.getSelection().toString().replace(${regTime}, '</b>').replace(${regEmoji}, '').replace(${regEdited}, '');
      var slackArray = slackParse.split(${regNewLine}).map(item => {return item.trim()});
      chrome.storage.local.set({'slackParse': slackArray});
      console.log(slackParse);
    `});
  setTimeout(function(){
    window.close();
  }, 2000);
}

function zendeskPaste() {
  chrome.tabs.executeScript(null,
    {code: `
      chrome.storage.local.get('slackParse', function (result) {
        var parse = result.slackParse;
        var x = document.getElementsByClassName('editor zendesk-editor--rich-text-comment')[0];
        var h = '<p>';
        for(var i = 0; i < parse.length; i++) {
          if (parse[i] && parse[i] !== '</b>') {
            if (parse[i].indexOf('</b>') > -1) {
              h += '<b>' + parse[i] + '<br>'
            } else if (parse[i+1] && parse[i+1] == '</b>') {
              h += '<b>' + parse[i] + '</b><br>'
            } else {
              h += parse[i] + '<br>'
            }
          } else {
            if (parse[i-1] && parse[i-1] && parse[i] !== '</b>'){
              h += '<br>'
            }
          }
        }
        h += '</p>'
        x.innerHTML = h;
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
