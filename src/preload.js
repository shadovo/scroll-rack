// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { clipboard, ipcRenderer } = require('electron');

// HANDLE DATA
function readConf() {
  ipcRenderer.invoke('read-config').then(config => {
    if (config) {
      renderConfig(config);
    } else {
      renderAddConfig()
    }
  });
}

// HTML TEMPLATES

function createAddConfigBox() {
   return `
    <div class="no-config-found">
      <h3>No config found</h3>
      <p>You can load a json fils in the following format with the conf</p>
      <p class="code">
      [{<br>
        &nbsp;&nbsp;"groupTitle":&nbsp;"title",<br>
        &nbsp;&nbsp;"scripts":&nbsp;[{<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"title": "script title",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"description": "my \`description\`",<br>
        &nbsp;&nbsp;&nbsp;&nbsp;"script": nvm use && \\\\\\n npm start<br>
        &nbsp;&nbsp;},<br>
        &nbsp;&nbsp;{...}]<br>
      }, {...}]<br>
    </p>
    <span id="button-load-missing-config" class="button">Load config</span>
    </div>`;
}

function createHamburgerIcon() {
  return `
    <svg viewBox="0 0 100 80" width="25" height="25">
      <rect width="100" height="15"></rect>
      <rect y="30" width="100" height="15"></rect>
      <rect y="60" width="100" height="15"></rect>
    </svg>`;
}

function createScript(groupId, scriptConf, scriptId) {
  const preparedScript = encodeHTML(scriptConf.script).replace(/<br>/g, '<br>&nbsp;&nbsp;');
  return `<div class="script__container" data-group-id="${groupId}" data-script-id="${scriptId}" title="Copy script to clipboard">
    <h3>${scriptConf.title}</h3>
    <p class="script__description">${encodeHTML(scriptConf.description).replace(/`(.*)`/g, '<span class="code">$1</span>')}</p>
    <p class="script"><span class="code">${preparedScript}</span></p>
  </div>`;
}

function createGroup(groupConf, groupId) {
  return `
    <div class="group">
      <h2 class="group__title group--closed" title="Click to reveal scripts">${encodeHTML(groupConf.groupTitle)} <span class="right">${createHamburgerIcon()}</span></h2>
      <div class="group__scripts">
        ${groupConf.scripts.map(createScript.bind({}, groupId)).join('')}
      </div>
    </div>
  `;
}

// RENDER HTML

function renderConfig(config) {
  document.getElementById('content').innerHTML = config.map(createGroup).join('');

  [...document.querySelectorAll('.script__container')].forEach(ele => {
    ele.addEventListener('click', () => {
      const script = config[ele.dataset.groupId].scripts[ele.dataset.scriptId].script;
      clipboard.writeText(script);
    }, false)
  });

  [...document.querySelectorAll('.group__title')].forEach(ele => {
    ele.addEventListener('click', () => {
        ele.classList.toggle('group--closed');
    }, false)
  });
}

function renderAddConfig() {
  document.getElementById('content').innerHTML = createAddConfigBox();
  document.querySelector('#button-load-missing-config').addEventListener('click', () => {
    ipcRenderer.invoke('load-config').then(readConf);
  });
}

// UTILS
function encodeHTML(str) {
  const tempEle = document.createElement('div');
  tempEle.innerText = str;
  return tempEle.innerHTML;
}

function select(selector) {
  return document.querySelector(selector);
}

function addClick(selector, callback) {
  select(selector).addEventListener('click', callback);
}

window.addEventListener('DOMContentLoaded', () => {
  readConf();

  // Add click handlers for buttons that are not dependant on conf.

  addClick('.icon--settings', () => {
    select('.settings__container').classList.remove('settings__container--closed');
  });

  addClick('.settings__container', () => {
    select('.settings__container').classList.add('settings__container--closed');
  });

  addClick('.icon--settings-close', () => {
    select('.settings__container').classList.add('settings__container--closed');
  });

  addClick('.settings', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  addClick('#button-export-config', () => {
    ipcRenderer.invoke('export-config');
  });

  addClick('#button-load-config', () => {
    ipcRenderer.invoke('load-config').then(readConf);
  });
});