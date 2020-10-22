/**
 * Author: DrowsyFlesh
 * Create: 2019/11/27
 * Description:
 */
import {MediaController} from './MediaController';
import store from 'store';
import {throttle} from 'lodash';
import URLParse from 'url-parse';

export class Player {
    constructor() {
        this.player = null;
        this.controller = null; // 当前播放列表
        this.config = {};
        this.broadcastInterval = null;

        this.addListener();
        this.initPlayer();
        this.initSongList();
        this.initMediaSessionControlHandle();
    }

    addListener = () => {
        chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
            const {requestHeaders, initiator} = details;
            const url = new URLParse(details.url, '', true);
            const {query: data} = url;
            const Headers = [...requestHeaders];
            if (/^chrome-extension:\/\//.test(initiator)) {
                const refererHeader = Headers.find((e) => e.name.toLowerCase() === 'referer');
                if (refererHeader) {
                    refererHeader.value = 'https://www.bilibili.com/';
                } else {
                    Headers.push({
                        name: 'referer',
                        value: 'https://www.bilibili.com/',
                    });
                }
                if (data && data.requestFrom === 'bilibili-music' && data.requestType === 'audioFromVideo') {
                    Headers.push({
                        name: 'Range',
                        value: 'bytes=0-',
                    });
                }
                return {requestHeaders: Headers};
            } else {
                return {requestHeaders};
            }
        }, {
            urls: [
                '*://*.bilivideo.com/*',
            ],
        }, ['blocking', 'requestHeaders', 'extraHeaders']);
        chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
            const {command = '', from = ''} = message;
            if (command === 'setSong') { // 设置当前播放媒体
                await this.controller.setSong(message.song);
            } else if (command === 'play') { // 播放
                await this.controller.play();
            } else if (command === 'pause') { // 暂停
                await this.controller.pause();
            } else if (command === 'setVolume' && message.volume !== undefined) {
                this.setVolume(+message.volume);
            } else if (command === 'setProgress' && message.progress !== undefined) {
                await this.controller.play();
                if (this.setProgress(message.progress)) {
                    sendResponse(message.progress);
                }
            } else if (command === 'getProgress') {
                const song = this.controller.getCurrentMedia();
                if (song && song.duration && this.player.currentTime) {
                    const progress = this.player.currentTime / song.duration;
                    if (this.saveProgress(progress)) {
                        sendResponse(progress);
                    }
                }
            } else if (command === 'setNextSong') {
                await this.controller.turnNext(this.config.playMode);
            } else if (command === 'setPrevSong') {
                await this.controller.turnPrev(this.config.playMode);
            } else if (command === 'getPlayerState') { // 获取播放器状态
                sendResponse(this.getPlayerState());
            } else if (command === 'getCurrentSong') { // 获取当前播放媒体
                sendResponse(this.controller.getCurrentMedia() || null);
            } else if (command === 'getSongList') { // 获取播放列表
                sendResponse({
                    song: this.controller.getCurrentMedia(),
                    songList: this.controller.getMediaList(),
                });
            } else if (command === 'setSongList' && message.songList) { // 设置媒体列表，覆盖
                await this.controller.setMediaList(message.songList);
                chrome.runtime.sendMessage({
                    command: 'modifySongListSuccessfully',
                    from: 'playerBackground',
                    song: this.controller.getCurrentMedia(),
                    songList: this.controller.getMediaList(),
                });
                this.saveController();
            } else if (command === 'clearSongList') { // 清空播放列表
                await this.controller.pause();
                await this.controller.clearMediaList();
                chrome.runtime.sendMessage({
                    command: 'modifySongListSuccessfully',
                    from: 'playerBackground',
                    song: this.controller.getCurrentMedia(),
                    songList: this.controller.getMediaList(),
                });
                this.saveController();
            } else if (command === 'addSong' && message.song) { // 添加媒体到播放列表
                await this.controller.addSong(message.song);
                const mediaList = this.controller.getMediaList();
                console.info(message.song, mediaList);
                chrome.runtime.sendMessage({
                    command: 'addSongSuccessfully',
                    from: 'playerBackground',
                    song: this.controller.getCurrentMedia(),
                    songList: mediaList,
                });
                this.saveController();
                sendResponse(mediaList);
            } else if (command === 'deleteSong' && message.song) {
                const targetMedia = this.controller.get(message.song.id);
                // 当删除正在播放且播放列表中项目数大于1时切到下一个媒体
                if (targetMedia && targetMedia.playing && this.controller.map.size > 1) {
                    await this.controller.turnNext(1);
                }
                await this.controller.deleteSong(message.song);
                chrome.runtime.sendMessage({
                    command: 'deleteSongSuccessfully',
                    from: 'playerBackground',
                    song: this.controller.getCurrentMedia(),
                    songList: this.controller.getMediaList(),
                });
                this.saveController();
                sendResponse();
            } else if (command === 'switchPlayMode') {
                await this.switchPlayMode().then(sendResponse);
            } else if (command === 'setMeted') {
                this.player.muted = !this.player.muted;
                sendResponse(this.player.muted);
            } else if (command === 'getConfig') {
                sendResponse(this.config);
            } else if (command === 'hideMediaList') {
                chrome.runtime.sendMessage({command: 'hideMediaList', from: 'playerBackground'});
            }
            return true;
        });
    };

    initMediaSessionControlHandle = () => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', this.controller.play);
            navigator.mediaSession.setActionHandler('pause', this.controller.pause);
            //navigator.mediaSession.setActionHandler('seekbackward', function() {});
            //navigator.mediaSession.setActionHandler('seekforward', function() {});
            navigator.mediaSession.setActionHandler('previoustrack', () => this.controller.turnPrev(this.config.playMode));
            navigator.mediaSession.setActionHandler('nexttrack', () => this.controller.turnNext(this.config.playMode));
        }
    };

    initConfig = () => {
        // init volume
        const config = this.getSubStore('config');
        let volume = 0.8;
        let playMode = 0;
        let progress = 0;
        if (config) {
            volume = config.volume;
            playMode = config.playMode;
            progress = config.progress;
        } else {
            this.setSubStore('config', {volume, playMode, progress});
        }

        return {volume, playMode, progress};
    };

    // 初始化播放列表，缓存在本地
    initSongList = () => {
        const controllerStore = this.getSubStore('controller') || {};
        const {map, startMedia, orderedEndMedia, randomEndMedia} = controllerStore;
        if (map) {
            map.forEach((media) => {
                if (!media[1].type) {
                    media[1].type = 'audio';
                }
            });
            console.info(map);
            this.controller = new MediaController(this.player, map, false, startMedia, orderedEndMedia, randomEndMedia);
        } else {
            this.controller = new MediaController(this.player, [], true);
        }
        const current = this.controller.getCurrentMedia();
        if (current) {
            this.config.duration = current.duration;
            this.player.currentTime = current.duration * this.config.progress;
            current.playing = false;
        } // 初始化媒体列表后，重置播放状态
    };

    initPlayer = () => {
        this.config = this.initConfig();
        this.player = new Audio();
        window.player = this.player;
        this.player.volume = this.config.volume;

        // 捕获错误
        this.player.addEventListener('error', function(event) {
            console.info(event);
        });

        // 开始加载音频数据
        this.player.addEventListener('loadstart', () => {
            //console.info(event);
            chrome.runtime.sendMessage({
                command: 'loadstart',
                from: 'playerBackground',
                song: this.controller.getCurrentMedia(),
                songList: this.controller.getMediaList(),
            });
        });

        // 可以开始播放，而且估计已经有加载足够的数据量确保在播放完前不会暂停
        this.player.addEventListener('canplaythrough', function() {
            void this.play();
        });

        // 暂停
        this.player.addEventListener('pause', () => {
            const current = this.controller.getCurrentMedia(); // 用于处理mac touch bar控制时的状态切换
            if (current) {
                current.playing = false;
            }
            this.saveController();
            chrome.runtime.sendMessage({
                command: 'pause',
                from: 'playerBackground',
                song: current,
                songList: this.controller.getMediaList(),
            });
            clearInterval(this.broadcastInterval);
        });

        // 播放
        this.player.addEventListener('play', () => {
            const current = this.controller.getCurrentMedia(); // 用于处理mac touch bar控制时的状态切换
            if (current) {
                current.playing = true;
            }
            this.saveController();
            chrome.runtime.sendMessage({
                command: 'play',
                from: 'playerBackground',
                song: current,
                songList: this.controller.getMediaList(),
            });
            //this.broadcastInterval = setInterval(() => {
            //    chrome.runtime.sendMessage({
            //        command: 'playState',
            //        from: 'playerBackground',
            //        currentTime: this.player.currentTime,
            //        duration: this.player.duration,
            //    });
            //}, 1000);
        });

        //// 正在播放
        //this.player.addEventListener('playing', function(event) {
        //    console.info(event);
        //});
        this.player.addEventListener('timeupdate', throttle(() => {
            this.saveProgress(this.player.currentTime / this.player.duration);
        }, 1000));

        // 播放结束
        this.player.addEventListener('ended', async () => {
            //console.info(event);
            await this.controller.turnNext(this.config.playMode);
            chrome.runtime.sendMessage({
                command: 'ended',
                from: 'playerBackground',
                song: this.controller.getCurrentMedia(),
                songList: this.controller.getMediaList(),
            });
        });

        this.player.addEventListener('volumechange', () => {
            chrome.runtime.sendMessage({
                command: 'volumeChange',
                from: 'playerBackground',
                volume: this.player.volume,
            });
        });
    };
    // 获取播放器状态
    getPlayerState = () => {
        const currentSong = this.controller.getCurrentMedia();
        if (!this.player) return 'disable'; // 没有播放器实例，不可用
        else if (currentSong) return 'paused';
        else if (!currentSong) return 'empty';
    };

    /**
     * 设置音量
     * @param value
     */
    setVolume = (value) => {
        this.player.volume = this.config.volume = value;
        this.setSubStore('config', this.config);
    };

    setProgress = (value) => {
        if (isNaN(this.player.duration)) {
            return;
        }
        this.player.currentTime = this.player.duration * value;
        this.player.progress = value;
        return this.saveProgress(value);
    };

    saveProgress = (value) => {
        if (isNaN(value)) {
            return;
        }
        this.config.progress = value;
        this.setSubStore('config', this.config);
        return value;
    };

    // 设置播放模式
    switchPlayMode = async (mode = this.config.playMode) => {
        if (mode === 3) mode = 0;
        else mode += 1;

        this.config.playMode = mode;
        this.setSubStore('config', this.config);
        return this.config.playMode;
    };

    saveController = () => {
        this.setSubStore('controller', this.controller);
    };

    getSubStore(subStoreName) {
        const res = store.get(`in-module-data-manager-${subStoreName}`);
        if (res) { return res; } else {
            store.set(`in-module-player-${subStoreName}`, undefined);
            return undefined;
        }
    }

    setSubStore(subStoreName, v) {
        store.set(`in-module-data-manager-${subStoreName}`, v);
    }
}
