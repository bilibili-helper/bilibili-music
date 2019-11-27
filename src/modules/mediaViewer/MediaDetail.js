import API from 'Modules/dataManager/apis';
import {fetchJSON, getCSRF} from 'Utils';

/**
 * Author: DrowsyFlesh
 * Create: 2019/11/27
 * Description:
 */
export class MediaDetail {
    constructor() {
        this.locked = false;
        this.lockCommand = null;
        this.cache = {}; // 缓存10分钟
        this.cacheDuration = 1200000;
        this.current = null;

        this.addListener();
    }

    __lock = (command = null) => {
        if (!command) return; // 无指令不上锁
        if (!this.locked) {
            this.locked = true;
            this.lockCommand = command;
        } else return Promise.reject(`locked by command: ${this.lockCommand} when run ${command}`);
    };

    __unlock = () => {
        this.locked = false;
        this.lockCommand = null;
    };

    addListener = () => {
        chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
            const {command = ''} = message;
            if (command === 'viewMedia' && message.sid) { // 查看媒体详情
                this.getMediaDetail(message.sid).then((song) => {
                    chrome.runtime.sendMessage({
                        command: 'setSongViewSuccessfully',
                        from: 'playerBackground',
                        song,
                    });
                });
            } else if (command === 'hideViewer') {
                chrome.runtime.sendMessage({command: 'hideViewer', from: 'playerBackground'});
            } else if (command === 'collectSong' && message.sid && message.cid !== undefined) {
                this.setCollect(message.sid, message.cid).then(() => {
                    return window.dataManager.initUserSongMenu().then(userMenu => {
                        window.dataManager.tempData.userMenu = userMenu;
                    });
                }).then(() => {
                    const song = window.player.controller.map.get(message.sid);
                    if (song) {
                        if (!!message.cid) song.collectIds.push(message.cid);
                        else song.collectIds = [];
                        chrome.runtime.sendMessage({
                            command: 'collectedSongSuccessfully',
                            from: 'playerBackground',
                            sid: message.sid,
                            cid: message.cid,
                            song,
                        });
                        chrome.runtime.sendMessage({
                            command: 'dataUpdated',
                            from: 'dataManager',
                            data: window.dataManager.tempData,
                        });
                    }
                });
            } else if (command === 'downloadLrc' && message.song) {
                this.downloadLrc(message.song);
            } else if (command === 'downloadMedia' && message.song) {
                this.downloadMedia(message.song);
            }
            return true;
        });
    };

    /**
     * 生成到期时间
     * @param duration // 有效时长，分钟
     * @returns {number}
     */
    createExpiredTime = (duration = 30) => Date.now() + this.cacheDuration * duration;

    // 获取媒体数据，缓存优先，缓存30分钟
    getMediaDetail = (sid) => {
        if (!sid) {
            return Promise.reject(`error sid: ${sid}`);
        }
        const cache = this.cache[sid];
        if (cache && cache.expiredTime >= Date.now()) {
            return Promise.resolve(cache);
        }

        // 缓存不存在或已经过期
        return Promise.all([
            this.getBasicData(sid),
            this.getTags(sid),
            this.getMembers(sid),
            this.getCollectStatus(sid),

        ]).then(([basic, tags, members]) => {
            return this.getLyric(basic.lyric).then((lrcData) => {
                return this.cache[sid] = {
                    ...basic,
                    lrcData,
                    tags,
                    members,
                    expiredTime: Date.now() + this.createExpiredTime(),
                };
            });
        });

    };

    // 获取媒体基础信息
    getBasicData = (sid) => fetchJSON(`${API.basic}?sid=${sid}`);

    // 获取媒体基础信息
    getTags = (sid) => fetchJSON(`${API.tags}?sid=${sid}`);

    // 获取媒体创作成员名单
    getMembers = (sid) => fetchJSON(`${API.members}?sid=${sid}`);

    // 获取媒体创作成员名单
    getCollectStatus = (sid) => fetchJSON(`${API.starStatus}?sid=${sid}`);

    // 获取相似媒体
    getSimilar = (sid) => fetchJSON(`${API.similar}?sid=${sid}`);

    getLyric = (url) => {
        if (!url) return Promise.resolve('');
        return fetch(url).then(res => res.text()).then(res => {
            const lrcArray = res.split('\n').map((s) => s.split(/\[(\d+?):(\d+?).(\d+?)\]/).slice(1));
            return lrcArray;
        });
    };

    // 设置媒体收藏属性
    setCollect = (sid, cid) => getCSRF().then((csrf) => {
        this.__lock('setCollect');
        const formData = new FormData();
        formData.set('sid', sid);
        formData.set('cids', cid);
        formData.set('csrf', csrf);
        return fetch(`${API.star}`, {
            method: 'post',
            body: formData,
        })
        .then(res => res.json())
        .then((res) => {
            if (res.code === 0) {
                return Promise.resolve(!!cid);
            } else return Promise.reject('设置收藏状态失败');
        }).catch(e => {
            console.error(e);
        }).finally(() => {
            this.__unlock();
        });
    });

    downloadLrc = (song) => {
        this.__lock('downloadLrc');
        const {author, title, lyric: url, id} = song;
        chrome.downloads.download({
            saveAs: true,
            url,
            filename: `${author}/${title}-${id}.lrc`,
        });
        chrome.runtime.sendMessage({
            command: 'setGAEvent',
            action: '点击-媒体详情页',
            category: '下载歌词',
        });
        this.__unlock();
    };

    downloadMedia = (media) => {
        this.__lock('downloadMedia');
        const {author, title, id} = media;
        this.__getMediaSrc(media).then(src => {
            chrome.downloads.download({
                saveAs: true,
                url: src,
                filename: `${author}/${title}-${id}.mp3`,
            });
        });
        this.__unlock();
    };

    /**
     * 获取媒体链接
     * @param sid
     * @param quality
     * @param privilege
     * @returns {Promise<unknown>}
     */
    __getMediaSrc = async (media, quality = 2, privilege = 2) => {
        return await fetchJSON(`${API.src}?sid=${media.id}&quality=${quality}&privilege=${privilege}`).then(res => res.cdns[0]);
    };
}
