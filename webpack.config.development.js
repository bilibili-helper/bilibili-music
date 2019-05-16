/* global require, module */
/**
 * Author: Ruo
 * Create: 2018-05-30
 * Description:
 */
const merge = require('webpack-merge');
const webpack = require('webpack');
const commonConfig = require('./webpack.config.common');

module.exports = merge(commonConfig, {
    mode: 'development',
    optimization: {
        nodeEnv: 'production',
    },
    plugins: [
        new webpack.EnvironmentPlugin({
            'DEBUG': true,
        }),
    ]
});
