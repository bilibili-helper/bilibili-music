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
        this.songList = []; // 当前播放列表
        this.playMode = 0; // 播放模式
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
                sendResponse({
                    song: this.getCurrent(),
                    songList: this.songList,
                });
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
            } else if (command === 'addSongMenu' && message.songList) {
                this.addSongMenu(message.songList).then(() => {
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
            } else if (command === 'switchPlayMode') {
                this.switchPlayMode().then(() => {
                    sendResponse(this.playMode);
                });
            } else if (command === 'getPlayMode') {
                sendResponse(this.playMode);
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

        // init play mode
        this.playMode = this.store ? this.store.playMode || 0 : 0;

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
            const currentIndex = this.getCurrentIndex();
            const currentSong = this.songList[currentIndex];
            if (currentSong) {
                currentSong.playing = false;
            }
            /**
             * 根据不同不放模式进行切歌操作
             */
            switch (this.playMode) {
                case 0: { // 列表顺序播放，到列表底部则自动暂停
                    if (currentIndex >= 0 && currentIndex < this.songList.length - 1) { // 不是列表中最后一个媒体
                        this.setSongByIndex(currentIndex + 1);
                    } else { // 播放完毕
                        chrome.runtime.sendMessage({
                            command: 'ended',
                            from: 'playerBackground',
                            song: currentSong,
                            songList: this.songList,
                        });
                    }
                    break;
                }
                case 1: { // 列表循环
                    if (currentIndex >= 0 && currentIndex < this.songList.length - 1) { // 不是列表中最后一个媒体
                        this.setSongByIndex(currentIndex + 1);
                    } else { // 列表播放完毕，从第一首开始循环
                        this.setSongByIndex(0);
                    }
                    break;
                }
                case 2: { // 单曲循环
                    this.setSongByIndex(currentIndex);
                    break;
                }
                case 3: { // 列表随机
                    const min = 0;
                    const max = this.songList.length;
                    const randomIndex = Math.floor((Math.random() * (max - min)) + min);
                    this.setSongByIndex(randomIndex);
                }
            }

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

    // 通过播放列表中的索引设置当前播放媒体
    setSongByIndex = (index) => {
        const songByIndex = this.getSongByIndex(index);
        const currentSong = this.getCurrent();
        if (currentSong && currentSong.id !== songByIndex.id) {
            currentSong.current = false;
            currentSong.playing = false;
        }
        songByIndex.current = true;
        return this.addSong(songByIndex).then(() => {
            this.player.src = songByIndex.src;
        });
    };

    // 通过索引获取播放列表中的媒体
    getSongByIndex = (index) => {
        if (!this.songList || this.songList.length === 0) return null;

        return this.songList[index];
    };

    // 获取当前播放的媒体对象
    getCurrent = () => {
        if (!this.songList || this.songList.length === 0) return null;

        return this.songList.find((song) => song.current);
    };

    // 获取当前播放媒体在播放列表中的索引
    getCurrentIndex = () => {
        if (!this.songList || this.songList.length === 0) return -1;

        return this.songList.findIndex((song) => song.current);
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

    // 清空播放列表
    clearSongList = () => {
        return new Promise(resolve => {
            this.songList = [];
            this.player.pause();
            this.store = {...this.store, songList: this.songList};
            resolve();
        });
    };

    // 设置播放模式
    switchPlayMode = (mode = this.playMode) => {
        return new Promise(resolve => {
            if (mode === 3) mode = 0;
            else mode += 1;
            this.playMode = mode;
            this.store = {...this.store, playMode: mode};
            resolve();
        });
    };

    /**
     * 获取媒体链接
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
        this.player.volume = value;
        this.store = {...this.store, volume: value};
    };
}
