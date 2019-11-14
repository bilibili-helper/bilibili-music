/* global process */
/**
 * Author: DrowsyFlesh
 * Create: 2018/12/9
 * Description:
 */
import {Feature} from 'Libs/feature';
import API from './apis';
import {fetchJSON} from 'Utils/https';
import {Howl, Howler} from 'howler';

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
        this.seek = null;
    }

    addListener = () => {
        let playIndex = null;
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const {command = ''} = message;
            if (command === 'playSong') {
                const {id} = message.song;
                this.getSongData(id, 2).then(res => {
                    this.initPlayerDOM(res.cdns[0]);
                    sendResponse(true);
                });
            } else if (command === 'play') {
                if (this.player) {
                    this.player.seek(this.seek);
                    this.player.play();
                }
            } else if (command === 'pause') {
                if (this.player) {
                    this.player.pause();
                    this.seek = this.player.seek();

                }
            }
            return true;
        });
    };

    launch = () => {
    };

    initPlayerDOM = (src) => {
        if (this.player) {
            this.changeSong(src);
        } else {
            this.player = new Howl({
                src,
                autoplay: true,
            });
        }
        console.warn(this.player);
    };

    changeSong = (src) => {
        if (this.player) {
            this.player.unload();
            this.player._src = src;
            this.player.load();
            this.player.play();
        }
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
