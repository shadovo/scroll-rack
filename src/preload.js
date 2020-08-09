// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { clipboard, ipcRenderer } = require('electron');

function hamburgerIcon() {
  return `
    <svg viewBox="0 0 100 80" width="25" height="25">
      <rect width="100" height="15"></rect>
      <rect y="30" width="100" height="15"></rect>
      <rect y="60" width="100" height="15"></rect>
    </svg>`;
}

function createScript(scriptConf) {
  return `<div class="script-container" data-script="${scriptConf.script}" title="Copy script to clipboard">
    <h3>${scriptConf.title}</h3>
    <p class="description">${scriptConf.description.replace(/`(.*)`/g, '<span class="code">$1</span>')}</p>
    <p class="script"><span class="code">${scriptConf.script.replace(/ \\/g, ' \\<br>&nbsp;&nbsp;')}</span></p>
  </div>`;
}

function createGroup(groupConf) {
  return `
    <div class="group">
      <h2 class="group-title group--closed" title="Click to reveal scripts">${groupConf.groupTitle} <span class="right">${hamburgerIcon()}</span></h2>
      <div class="group-scripts">
        ${groupConf.scripts.map(createScript).join('')}
      </div>
    </div>
  `;
}

function copyToClipboard(script) {
  clipboard.writeText(script);
  console.log('ADDED TO CLIPBOARD: ', script);
}

function renderConfig(config) {
  document.getElementById('content').innerHTML = config.map(createGroup).join('');
  [...document.querySelectorAll('.script-container')].forEach(function (ele) {
    ele.addEventListener('click', function () {
        copyToClipboard(this.dataset.script);
    }, false)
  });
  [...document.querySelectorAll('.group-title')].forEach(function (ele) {
    ele.addEventListener('click', function () {
        this.classList.toggle('group--closed');
    }, false)
  });
}

function renderAddConfig() {
  document.getElementById('content').innerHTML = `
    <div class="no-config-found">
      <h3>No config found</h3>
      <p>You can load a json fils in the following format with the conf</p>
      <p class="code">
      [{<br>
        &nbsp;&nbsp;"groupTitle":&nbsp;"title",<br>
        &nbsp;&nbsp;"scripts":&nbsp;[{<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"title": "script title",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"description": "my \`description\`",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"script": nvm use && \\\n npm start<br>
        &nbsp;&nbsp;},<br>
        &nbsp;&nbsp;{...}]<br>
      }, {...}]<br>
    </p>
    <span id="button-load-missing-config" class="settings-button">Load config</span>
    </div>
  `;
  document.querySelector('#button-load-missing-config').addEventListener('click', async function () {
    ipcRenderer.invoke('load-config').then(readConf);
  });
}

function readConf() {
  ipcRenderer.invoke('read-config').then(config => {
    if (config) {
      renderConfig(config);
    } else {
      renderAddConfig()
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  readConf();

  document.querySelector('.settings-icon').addEventListener('click', function () {
    document.querySelector('.settings-container').classList.remove('settings-container--closed');
  });

  document.querySelector('.settings-container').addEventListener('click', function () {
    document.querySelector('.settings-container').classList.add('settings-container--closed');
  });

  document.querySelector('.settings-close-icon').addEventListener('click', function () {
    document.querySelector('.settings-container').classList.add('settings-container--closed');
  });

  document.querySelector('.settings').addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  document.querySelector('#button-export-config').addEventListener('click', async function () {
    ipcRenderer.invoke('export-config');
  });

  document.querySelector('#button-load-config').addEventListener('click', async function () {
    ipcRenderer.invoke('load-config').then(readConf);
  });
});