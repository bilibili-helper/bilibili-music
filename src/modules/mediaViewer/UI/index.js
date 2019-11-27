/**
 * Author: DrowsyFlesh
 * Create: 2019/11/20
 * Description:
 */
import {UI} from 'Libs/UI';
import React from 'react';
import ReactDOM from 'react-dom';
import {Viewer} from './Viewer';

export class MediaViewerUI extends UI {
    constructor() {
        super({
            name: 'mediaViewer',
            dependencies: ['player'],
        });
    }

    load = ([controllerAnchor]) => {
        return new Promise(resolve => {
            const wrapper = document.createElement('div');
            controllerAnchor.appendChild(wrapper);
            ReactDOM.render(<Viewer/>, wrapper, resolve);
        });
    };
}
