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
    }

    addListener = () => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            //console.info('sender', sender);
            const {command = '', from = ''} = message;
            if (command === 'setSong') {
                const {id} = message.song;
                this.player.currentSong = message.song;
                this.getSongData(id, 2).then(res => {
                    this.setSong(res.cdns[0]);
                    sendResponse(true);
                });
            } else if (command === 'play' && from === 'player') {
                this.player.play();
                sendResponse();
            } else if (command === 'pause' && from === 'player') {
                this.player.pause();
                sendResponse();
            } else if (command === 'getPlayerState') {
                sendResponse(this.getPlayerState());
            } else if (command === 'getCurrentSong') {
                sendResponse(this.player ? this.player.currentSong : null);
            }
            return true;
        });
    };

    launch = () => {
        this.initPlayer();
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
        this.player.addEventListener('pause', function(event) {
            console.info(event);
            chrome.runtime.sendMessage({
                command: 'pause',
                from: 'playerBackground',
            });
        });

        // 播放
        this.player.addEventListener('play', function(event) {
            console.info(event);
            chrome.runtime.sendMessage({
                command: 'play',
                from: 'playerBackground',
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
            });
        });
    };

    getPlayerState() {
        if (!this.player) return 'disable'; // 播放器没有实例，不可用
        else if (this.player.paused) return 'paused'; // 暂停
        else if (this.player.readyState === 0) return 'empty'; // 没有加载媒体
        console.info('seeking', this.player);
    }

    setSong = (src) => {
        this.player.src = src;
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
