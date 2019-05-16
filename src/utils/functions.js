/* global process, chrome */
/**
 * Author: Ruo
 * Create: 2018-08-19
 * Description: 常用方法
 */


import moment from 'moment';

/**
 * @param command {string}
 * @param key {string}
 * @param callback {Function}
 */
export const sendMessage = (command, key, callback) => {
    chrome.runtime.sendMessage({command, key}, (response) => {
        if (callback instanceof Function) {
            callback(response);
        } else {
            console.error(`"SendMessage" (command: ${command} key: ${key}): invalid callback function.`);
        }
    });
};

/**
 * @param t {string}
 * @param options {object}
 */
export const __ = (t, options = null) => chrome.i18n.getMessage(t, options);

/**
 * 创建新tab页面
 * @param url
 */
export const createTab = (url) => {
    chrome.tabs.create({url});
};

/**
 * 当前版本号
 * @type {string}
 */
export const version = chrome.runtime.getManifest().version;

/**
 * 根据资源名获取扩展程序内部资源
 * @param name
 */
export const getURL = (name) => chrome.extension.getURL(name);

/**
 * 检查传入的版本号是否比当前版本号大
 * @param checkVersion
 * @return {boolean}
 */
export const hasNewVersion = (checkVersion) => {
    return isBiggerThan(checkVersion, version) > 0;
};

/**
 * Get semantic file name (without extension) from video playback page.
 * @param doc
 * @return {string}
 */
export const getFilename = (doc) => {
    const partDOM = doc.querySelector('#v_multipage a.on, #multi_page .cur-list li.on a, #eplist_module .list-wrapper ul .cursor');
    const partName = partDOM ? partDOM.innerText : '';
    const title = doc.querySelector('#viewbox_report h1, .header-info h1, .media-wrapper > h1').getAttribute('title');
    return `${title}${partName ? `_${partName}` : ''}`;
};

/**
 * 将毫秒数转化为XX:XX格式的字符串
 * @param time
 * @return {string}
 */
export const parseTime = (time) => {
    const minute = parseInt(time / 60000);
    const second = parseInt((time / 1000) % 60);
    return String(minute).padStart(2, '0') + ':' + String(second).padStart(2, '0');
};

// 判断是否在直播间
export const inLiveRoom = () => /^\/([/blanc/\d]+)$/.exec(window.location.pathname) ? true : false;

export const consoleLogo = () => {
    // eslint-disable-next-line no-console
    console.log(`%c ${process.env.PROJECT_NAME} version: ${version}`, 'color: #00a1d6');
};

/**
 * 将秒数转为00:00:00格式
 * @param seconds
 * @return {string}
 */
export const toDuration = (seconds) => {
    const duration = moment.duration(seconds, 'seconds');
    const hoursStr = duration.hours();
    const minutesStr = String(duration.minutes()).padStart(2, 0);
    const secondsStr = String(duration.seconds()).padStart(2, 0);
    let durationStr = `${Number(hoursStr) ? hoursStr + ':' : ''}${minutesStr}:${secondsStr}`;
    if (durationStr[0] === '0') { durationStr = durationStr.slice(1); }
    return durationStr;
};

export const isBiggerThan = (a, b) => {
    if (a === b) {
        return 0;
    }

    let a_components = a.split('.');
    let b_components = b.split('.');

    let len = Math.min(a_components.length, b_components.length);

    // loop while the components are equal
    for (let i = 0; i < len; i++) {
        // A bigger than B
        if (parseInt(a_components[i] || 0) > parseInt(b_components[i] || 0)) {
            return 1;
        }

        // B bigger than A
        if (parseInt(a_components[i] || 0) < parseInt(b_components[i] || 0)) {
            return -1;
        }
    }

    // If one's a prefix of the other, the longer one is greater.
    if (a_components.length > b_components.length) {
        return 1;
    }

    if (a_components.length < b_components.length) {
        return -1;
    }

    // Otherwise they are the same.
    return 0;
};
