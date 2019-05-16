/* global require, module */
/**
 * Author: Ruo
 * Create: 2018-05-30
 * Description:
 */

const webpack = require('webpack');
const merge = require('webpack-merge');
const commonConfig = require('./webpack.config.common');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = merge(commonConfig, {
    mode: 'production',
    optimization: {
        nodeEnv: 'production',
        minimizer: [
            new UglifyJsPlugin({
                sourceMap: false, // set to true if you want JS source maps
                uglifyOptions: {
                    compress: true,
                    ecma: 6,
                    mangle: true,
                    output: {
                        beautify: true,
                    },
                },
            }),
            new OptimizeCSSAssetsPlugin({}),
        ],
    },
    plugins: [
        new webpack.EnvironmentPlugin({
            'DEBUG': false,
        }),
    ]
});
