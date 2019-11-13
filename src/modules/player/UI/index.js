/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import {UI} from 'Libs/UI';
import React from 'react';
import ReactDOM from 'react-dom';
import {Player} from './Player';

export class PlayerUI extends UI {
    constructor() {
        super({
            name: 'popup',
            dependencies: ['popupAnchor'],
        });
    }

    load = ([popupAnchor]) => {
        return new Promise(resolve => {
            const wrapper = document.createElement('div');
            popupAnchor.appendChild(wrapper);
            ReactDOM.render(<Player/>, wrapper, resolve);
        });
    };
}
