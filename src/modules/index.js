/* global require */
/**
 * Author: Ruo
 * Create: 2018-06-12
 * Description: 功能点打包入口
 */
import {Background} from 'Modules/background';
import {GoogleAnalytics} from 'Modules/googleAnalytics';
import {DataManager} from 'Modules/dataManager';
import {PopupAnchor} from 'Modules/popupAnchor';
import {Player} from 'Modules/Player';
import {Home} from 'Modules/home';
import {Login} from 'Modules/login';
import {MediaViewer} from 'Modules/mediaViewer';

export const Features = {
    GoogleAnalytics,
    Background,
    DataManager,
    PopupAnchor,
    Player,
    Home,
    Login,
    MediaViewer,
};
