/**
 * Author: DrowsyFlesh
 * Create: 2019/11/20
 * Description:
 */
import {UI} from 'Libs/UI';
import React from 'react';
import ReactDOM from 'react-dom';
import {SongViewer} from './SongViewer';

export class SongViewerUI extends UI {
    constructor() {
        super({
            name: 'songViewer',
            dependencies: ['popupAnchor'],
        });
    }

    load = ([popupAnchor]) => {
        return new Promise(resolve => {
            const wrapper = document.createElement('div');
            popupAnchor.appendChild(wrapper);
            ReactDOM.render(<SongViewer/>, wrapper, resolve);
        });
    };
}
