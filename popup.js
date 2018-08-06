'use strict';
/* global chrome */

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
  chrome.tabs.executeScript(null,
    {code: `
      chrome.storage.local.set({'slackParse': window.getSelection().toString()});
      console.log('Copied Slack Thread');
    `});
  setTimeout(function(){
    window.close();
  }, 2000);
}

function zendeskPaste() {
  var regTime = /\[.*ago\]/g;
  var regEmoji = /:\S*:/g;
  var regEdited = /\(edited\)/g;
  var regCloudApp = /cl.ly\nImage.*/g;

  var regNewLine = /\r?\n/;
  var regUrl = /http\S*/g;

  chrome.tabs.executeScript(null,
    {code: `
      var regObj = {
        time: [${regTime}, '</b>'],
        emoji: [${regEmoji}, ''],
        edited: [${regEdited}, ''],
        cloudApp: [${regCloudApp}, '']
      }
      chrome.storage.local.get('slackParse', function (result) {
        var parseStr = result.slackParse;
        for (var x in regObj) {
          parseStr = parseStr.replace(regObj[x][0], regObj[x][1])
        }
        var urlStr = parseStr;
        var urlMatch = ${regUrl}.exec(urlStr);
        var urlMatches = [];
        while (urlMatch != null) {
          urlMatches.push(urlMatch[0]);
          urlStr = urlStr.substring(urlMatch.index + urlMatch[0].length);
          urlMatch = ${regUrl}.exec(urlStr);
        }
        urlMatches.forEach(match => {
          parseStr = parseStr.replace(match, '<a href="' + match + '" target="blank">' + match + '</a>')
        })
        var parse = parseStr.split(${regNewLine}).map(item => {return item.trim()});
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
