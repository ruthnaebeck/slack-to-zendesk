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

// var range;
//       if (document.selection && document.selection.createRange) {
//         range = document.selection.createRange();
//         console.log(range.htmlText);
//       }

function slackCopy() {
  chrome.tabs.executeScript(null,
    {code: `
      var selection = window.getSelection();
      var range = selection.getRangeAt(0);
      var clonedSelection = range.cloneContents();
      var div = document.createElement('div');
      div.appendChild(clonedSelection);
      chrome.storage.local.set({
        'slackText': selection.toString(),
        'slackHTML': div.innerHTML
      });
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
  var regUrl = /[^`]http\S*/g;
  var regCode = /`\S*`/g;

  chrome.tabs.executeScript(null,
    {code: `
      var regObj = {
        time: [${regTime}, '</b>'],
        emoji: [${regEmoji}, ''],
        edited: [${regEdited}, ''],
        cloudApp: [${regCloudApp}, '']
      }
      chrome.storage.local.get(['slackText', 'slackHTML'], function (result) {
        var parseStr = result.slackText;
        for (var x in regObj) {
          parseStr = parseStr.replace(regObj[x][0], regObj[x][1])
        }
        var rMatches = [];

        var urlStr = parseStr;
        var urlMatch = ${regUrl}.exec(urlStr);
        while (urlMatch != null) {
          rMatches.push(urlMatch[0]);
          urlStr = urlStr.substring(urlMatch.index + urlMatch[0].length);
          urlMatch = ${regUrl}.exec(urlStr);
        }
        rMatches.forEach(match => {
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
