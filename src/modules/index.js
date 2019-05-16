/* global require */
/**
 * Author: Ruo
 * Create: 2018-06-12
 * Description: 功能点打包入口
 */
import {Background} from './background';
import {GoogleAnalytics} from './googleAnalytics';
import {PopupAnchor} from './popupAnchor';

export const Features = {
    GoogleAnalytics,
    Background,
    PopupAnchor,
};
