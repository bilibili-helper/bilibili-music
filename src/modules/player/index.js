/* global process */
/**
 * Author: DrowsyFlesh
 * Create: 2018/12/9
 * Description:
 */
import {Feature} from 'Libs/feature';
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
            const {command = ''} = message;
            if (command === 'playSong') {
                sendResponse();
            }
            return true;
        });
    };

    launch = () => {
        this.initPlayerDOM();
    }

    initPlayerDOM = () => {
        this.player = document.querySelector('#player');
        if (!this.player) {
            this.player = document.createElement('audio');
            this.player.setAttribute('id', 'player');
            document.body.appendChild(this.player);
        }
    }
}
