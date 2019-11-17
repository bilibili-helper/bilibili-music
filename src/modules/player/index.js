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
            dependencies: ['popupAnchor', 'googleAnalytics'],
            settings: {
                on: true,
                hide: true,
                hasUI: true,
                toggle: false,
            },
        });

        this.player = null;
        this.songList = [];
    }

    addListener = () => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const {command = '', from = ''} = message;
            if (command === 'setSong') { // 设置当前播放媒体
                const {id} = message.song;
                const currentSong = this.getCurrent();
                if (currentSong && currentSong.id === message.song.id) { // 设置同一首歌
                    if (currentSong.playing) {
                        this.player.pause();
                    } else {
                        if (!this.player.src) {
                            this.player.src = currentSong.src;
                        } else {
                            this.player.play();
                        }
                    }
                    sendResponse();
                } else {
                    this.getSongData(id, 2).then(res => {
                        message.song.src = res;
                        this.setSong(message.song).then(() => {
                            sendResponse(true);
                        });
                    });
                }
            } else if (command === 'play' && from === 'player') { // 播放
                // 由于设定src后自动播放，所以初始化时没有用最近一次播放的媒体src进行初始化
                // 这里判断是否存在最近播放的媒体，存在则设置src
                if (!this.player.src) {
                    const currentSong = this.getCurrent();
                    if (currentSong) {
                        if (currentSong.src) {
                            this.player.src = currentSong.src;
                        } else {
                            this.getSongData(currentSong.id, 2).then(res => {
                                currentSong.src = res;
                                this.player.src = currentSong.src;
                            });
                        }
                    } else this.player.pause();
                } else {
                    this.player.play();
                }
                sendResponse();
            } else if (command === 'pause' && from === 'player') { // 暂停
                this.getCurrent().playing = false;
                this.player.pause();
                sendResponse();
            } else if (command === 'getVolume') {
                sendResponse(this.player.volume);
            } else if (command === 'setVolume' && message.volume !== undefined) {
                this.setVolume(+message.volume);
            } else if (command === 'getPlayerState') { // 获取播放器状态
                sendResponse(this.getPlayerState());
            } else if (command === 'getCurrentSong') { // 获取当前播放媒体
                sendResponse(this.getCurrent() || null);
            } else if (command === 'getSongList') { // 获取播放列表
                sendResponse(this.songList);
            } else if (command === 'clearSongList') { // 清空播放列表
                this.clearSongList().then(() => {
                    chrome.runtime.sendMessage({
                        command: 'clearSongListSuccessfully',
                        from: 'playerBackground',
                        song: this.getCurrent(),
                        songList: this.songList,
                    });
                    sendResponse();
                });
            } else if (command === 'addSong' && message.song) { // 添加媒体到播放列表
                this.addSong(message.song).then(() => {
                    chrome.runtime.sendMessage({
                        command: 'addSongSuccessfully',
                        from: 'playerBackground',
                        song: this.getCurrent(),
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
                        song: this.getCurrent(),
                        songList: this.songList,
                    });
                    sendResponse(this.songList);
                }, () => {
                    sendResponse(this.songList);
                });
            } else if (command === 'addSongMenu' && message.songMenu) {
                this.addSongMenu(message.songMenu).then(() => {
                    const currentSong = this.getCurrent();
                    if (currentSong.src) {
                        this.player.src = currentSong.src;
                    } else {
                        this.getSongData(currentSong.id, 2).then(res => {
                            currentSong.src = res;
                            this.player.src = currentSong.src;
                        });
                    }
                });
            }
            return true;
        });
    };

    launch = () => {
        this.initPlayer();
        this.initSongList();
    };

    // 初始化播放列表，缓存在本地
    initSongList = () => {
        if (!this.store) {
            this.store = {
                songList: [],
            };
        }
        if (this.store.songList) {
            this.songList = this.store.songList.map((song) => {
                song.playing = false;
                return song;
            });
        } else {
            this.store.songList = [];
            this.songList = this.store.songList;
        }
    };

    initPlayer = () => {
        this.player = new Audio();

        // init volume
        const volume = this.store ? this.store.volume || 0.8 : 0.8;
        this.player.volume = volume;

        // 捕获错误
        this.player.addEventListener('error', function(event) {
            console.info(event);
        });

        // 开始加载音频数据
        this.player.addEventListener('loadstart', (event) => {
            //console.info(event);
            chrome.runtime.sendMessage({
                command: 'loadstart',
                from: 'playerBackground',
                song: this.getCurrent(),
                songList: this.songList,
            });
        });

        // 可以开始播放，但是可能还没有加载足够的数据量确保在播放完前不会暂停
        this.player.addEventListener('canplay', function(event) {
            //console.info(event);
        });

        // 可以开始播放，而且估计已经有加载足够的数据量确保在播放完前不会暂停
        this.player.addEventListener('canplaythrough', function(event) {
            //console.info(event);
            void this.play();
        });

        // 加载数据时触发该事件
        this.player.addEventListener('progress', function(event) {
            //console.info(event);
        });

        // 暂停
        this.player.addEventListener('pause', (event) => {
            //console.info(event);
            const currentSong = this.getCurrent();
            if (currentSong) { // 如果删除正在播放的媒体，会先暂停
                currentSong.playing = false;
            }
            chrome.runtime.sendMessage({
                command: 'pause',
                from: 'playerBackground',
                song: currentSong,
                songList: this.songList,
            });
        });

        // 播放
        this.player.addEventListener('play', (event) => {
            //console.info(event);
            const currentSong = this.getCurrent();
            currentSong.playing = true;
            chrome.runtime.sendMessage({
                command: 'play',
                from: 'playerBackground',
                song: currentSong,
                songList: this.songList,
            });
        });

        //// 正在播放
        //this.player.addEventListener('plaing', function(event) {
        //    //console.info(event);
        //});

        // 播放结束
        this.player.addEventListener('ended', (event) => {
            //console.info(event);
            const currentSong = this.getCurrent();
            currentSong.playing = false;
            chrome.runtime.sendMessage({
                command: 'ended',
                from: 'playerBackground',
                song: currentSong,
                songList: this.songList,
            });
        });

        this.player.addEventListener('volumechange', () => {
            chrome.runtime.sendMessage({
                command: 'volumechange',
                from: 'playerBackground',
                volume: this.player.volume,
            });
        });
    };

    getPlayerState = () => {
        const currentSong = this.getCurrent();
        if (!this.player) return 'disable'; // 播放器没有实例，不可用
        else if (currentSong) {
            return 'paused';
        } else if (!currentSong) return 'empty';
        else if (this.player.readyState === 0) return 'empty'; // 没有加载媒体
        else if (this.player.paused) return 'paused'; // 暂停
    };

    // 设置播放媒体
    setSong = (song) => {
        const currentSong = this.getCurrent();
        if (currentSong && currentSong.id !== song.id) {
            currentSong.current = false;
            currentSong.playing = false;
        }
        song.current = true;
        return this.addSong(song).then(() => {
            this.player.src = song.src;
        });
    };

    getCurrent = () => {
        if (!this.songList || this.songList.length === 0) return null;

        return this.songList.find((song) => song.current);
    };

    // 添加媒体到播放列表
    addSong = (song) => {
        return new Promise((resolve) => {
            const queryIndex = this.songList.findIndex((item) => song.id === item.id);

            if (queryIndex >= 0) { // 如果媒体已在列表中，则不作反应
                this.songList[queryIndex] = song;
            } else {
                if (this.songList.length === 0) {
                    song.current = true;
                }
                this.songList.push(song);
            }

            this.store = {...this.store, songList: this.songList};
            resolve();
        });
    };

    addSongMenu = (songMenu) => {
        return new Promise(resolve => {
            if (songMenu.length) {
                this.songList = songMenu;
                this.songList[0].current = true;
                this.store = {...this.store, songList: this.songList};
            }
            resolve();
        });
    };

    reduceSong = (song) => {
        return new Promise((resolve, reject) => {
            const index = this.songList.findIndex((item) => song.id === item.id);

            if (index >= 0) {
                const queryRes = this.songList[index];
                if (queryRes.playing) this.player.pause();

                this.songList.splice(index, 1);
                if (this.songList[index]) {
                    this.songList[index].current = true;
                }
                this.store = {...this.store, songList: this.songList};
                resolve();
            } else {
                reject();
            }
        });
    };

    clearSongList = () => {
        return new Promise(resolve => {
            this.songList = [];
            this.player.pause();
            this.store = {...this.store, songList: this.songList};
            resolve();
        });
    };

    /**
     * 获取歌曲链接
     * @param sid
     * @param quality
     * @param privilege
     * @returns {Promise<unknown>}
     */
    getSongData = (sid, quality = 2, privilege = 2) => {
        return fetchJSON(`${API.songData}?sid=${sid}&quality=${quality}&privilege=${privilege}`)
        .then(res => {
            return res.cdns[0];
        });
    };

    setVolume = (value) => {
        this.store = {...this.store, volume: value};
        this.player.volume = value;
    };
}
