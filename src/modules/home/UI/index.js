/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
import {UI} from 'Libs/UI';
import React from 'react';
import ReactDOM from 'react-dom';
import {Home} from './Home';

export class HomeUI extends UI {
    constructor() {
        super({
            name: 'home',
            dependencies: ['popupAnchor'],
        });
    }

    load = ([popupAnchor]) => {
        return new Promise(resolve => {
            const wrapper = document.createElement('div');
            popupAnchor.appendChild(wrapper);
            ReactDOM.render(<Home/>, wrapper, resolve);
        });
    };
}
