/* global process */
/**
 * Author: DrowsyFlesh
 * Create: 2018/12/9
 * Description:
 */
import {Feature} from 'Libs/feature';
import {fetchJSON} from 'Utils/https';
import API from './apis';

//import {__, createTab, hasNewVersion, version, getURL} from 'Utils';

export class Player extends Feature {
    constructor() {
        super({
            name: 'player',
            kind: 'popup',
            permission: ['notifications'],
            dependencies: ['popupAnchor'],
            settings: {
                on: true,
                hide: true,
                hasUI: true,
                toggle: false,
            },
        });

        this.player = null;
        this.currentSong = null;
    }

    addListener = () => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            //console.info('sender', sender);
            const {command = '', from = ''} = message;
            if (command === 'setSong') { // 设置当前播放媒体
                const {id} = message.song;
                if (this.currentSong && this.currentSong.id === message.song.id) { // 设置同一首歌
                    if (this.currentSong.playing) {
                        this.currentSong.playing = false;
                        this.player.pause();
                    } else {
                        this.currentSong.playing = true;
                        this.player.play();
                    }
                    sendResponse();
                } else {
                    this.currentSong = message.song;
                    this.getSongData(id, 2).then(res => {
                        message.song.src = res.cdns[0];
                        this.setSong(message.song).then(() => {
                            sendResponse(true);
                        });
                    });
                }
            } else if (command === 'play' && from === 'player') { // 播放
                void this.player.play();
                sendResponse();
            } else if (command === 'pause' && from === 'player') { // 暂停
                this.currentSong.playing = false;
                this.player.pause();
                sendResponse();
            } else if (command === 'getPlayerState') { // 获取播放器状态
                sendResponse(this.getPlayerState());
            } else if (command === 'getCurrentSong') { // 获取当前播放媒体
                sendResponse(this.player ? this.currentSong : null);
            } else if (command === 'getSongList') { // 获取播放列表
                sendResponse(this.songList);
            } else if (command === 'addSong' && message.song) { // 添加媒体到播放列表
                this.addSong(message.song).then(() => {
                    chrome.runtime.sendMessage({
                        command: 'addSongSuccessfully',
                        from: 'playerBackground',
                        songList: this.songList,
                    });
                    sendResponse(this.songList);
                }, () => {
                    sendResponse(this.songList);
                });

            } else if (command === 'reduceSong' && message.song) {
                this.reduceSong(message.song).then(() => {
                    chrome.runtime.sendMessage({
                        command: 'reduceSongSuccessfully',
                        from: 'playerBackground',
                        songList: this.songList,
                    });
                    sendResponse(this.songList);
                }, () => {
                    sendResponse(this.songList);
                });
            }
            return true;
        });
    };

    launch = () => {
        this.initSongList();
        this.initPlayer();
    };

    // 初始化播放列表，缓存在本地
    initSongList = () => {
        if (!this.store) {
            this.store = {
                songList: [],
            };
        }
        if (!this.store.songList) {
            this.store.songList = [];
            this.songList = this.store.songList;
        } else {
            this.songList = this.store.songList;
        }
    };

    initPlayer = () => {
        this.player = new Audio();

        // 捕获错误
        this.player.addEventListener('error', function(event) {
            console.info(event);
        });

        // 开始加载音频数据
        this.player.addEventListener('loadstart', function(event) {
            console.info(event);
            chrome.runtime.sendMessage({
                command: 'loadstart',
                from: 'playerBackground',
                song: this.currentSong,
                songList: this.songList,
            });
        });

        // 可以开始播放，但是可能还没有加载足够的数据量确保在播放完前不会暂停
        this.player.addEventListener('canplay', function(event) {
            console.info(event);
        });

        // 可以开始播放，而且估计已经有加载足够的数据量确保在播放完前不会暂停
        this.player.addEventListener('canplaythrough', function(event) {
            console.info(event);
            void this.play();
        });

        // 加载数据时触发该事件
        this.player.addEventListener('progress', function(event) {
            console.info(event);
        });

        // 暂停
        this.player.addEventListener('pause', (event) => {
            console.info(event);
            chrome.runtime.sendMessage({
                command: 'pause',
                from: 'playerBackground',
                song: this.currentSong,
                songList: this.songList,
            });
        });

        // 播放
        this.player.addEventListener('play', (event) => {
            console.info(event);
            chrome.runtime.sendMessage({
                command: 'play',
                from: 'playerBackground',
                song: this.currentSong,
                songList: this.songList,
            });
        });

        // 正在播放
        this.player.addEventListener('plaing', function(event) {
            console.info(event);
        });

        // 播放结束
        this.player.addEventListener('ended', function(event) {
            console.info(event);
            chrome.runtime.sendMessage({
                command: 'ended',
                from: 'playerBackground',
                song: this.currentSong,
                songList: this.songList,
            });
        });
    };

    getPlayerState() {
        if (!this.player) return 'disable'; // 播放器没有实例，不可用
        else if (!this.currentSong) return 'empty';
        else if (this.player.paused) return 'paused'; // 暂停
        else if (this.player.readyState === 0) return 'empty'; // 没有加载媒体
        console.info('seeking', this.player);
    }

    // 设置播放媒体
    setSong = (song) => {
        return this.addSong(song).then(() => {
            if (this.currentSong) {
                this.currentSong.playing = false;
            }
            song.playing = true;
            this.currentSong = song;
            this.player.src = song.src;
        });
    };

    // 添加媒体到播放列表
    addSong = (song) => {
        return new Promise((resolve, reject) => {
            const queryIndex = this.songList.findIndex((item) => song.id === item.id);

            if (queryIndex >= 0) { // 如果媒体已在列表中，则不作反应
                //this.songList[queryIndex] = song;
            } else {
                this.songList.push(song);
            }

            this.store = {...this.store, songList: this.songList};
            resolve();
        });
    };

    reduceSong = (song) => {
        return new Promise((resolve, reject) => {
            const queryIndex = this.songList.findIndex((item) => song.id === item.id);

            if (queryIndex >= 0) {
                this.songList.splice(queryIndex, 1);
                this.store = {...this.store, songList: this.songList};
                resolve();
            } else {
                reject();
            }
        });
    };

    /**
     * 获取歌曲链接
     * @param sid
     * @param quality
     * @param privilege
     * @returns {Promise<unknown>}
     */
    getSongData = (sid, quality = 2, privilege = 2) => fetchJSON(`${API.songData}?sid=${sid}&quality=${quality}&privilege=${privilege}`);
}
