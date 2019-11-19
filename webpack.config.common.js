/**
 * Author: DrowsyFlesh
 * Create: 2019-05-15
 * Description:
 */
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MergeJsonWebpackPlugin = require('merge-jsons-webpack-plugin');
const WriteJsonPlugin = require('./write-json-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const srcPath = path.resolve('src');
const buildPath = path.resolve('build');
const jsPath = srcPath;
const indexFilename = 'index';

// get i18n json path for copy
const localesSupportList = require('./localesSupportList.json');
const localesGroup = localesSupportList.map((name) => ({
    pattern: `{./src/**/_locales/${name}/messages.json,./src/_locales/${name}/*.json}`,
    fileName: `./_locales/${name}/messages.json`,
}));

// sync version
let manifestJSON, packageJSON;
packageJSON = require('./package.json');
manifestJSON = require('./src/manifest.json');
if (process.env.npm_config_setversion) {
    const version = /^([\d.]+)(?:-beta\.)?(\d+)?/.exec(process.env.npm_config_setversion);
    if (version && version[1]) {
        packageJSON.version = process.env.npm_config_setversion;
        manifestJSON.version = `${version[1]}${version[2] ? '.' + version[2] : ''}`;
    }
}

// get page entries
const pageRegExp = new RegExp(`${srcPath}\/pages\/(.+)\/index\.js`);
const pageEntryArray = glob.sync(`${srcPath}/pages/*/index.js`).map((pathname) => {
    const res = pageRegExp.exec(pathname);
    if (res) {
        const filename = res[1];
        return [`js/pages/${filename}`, path.join(jsPath, 'pages', filename, indexFilename)];
    }
}).reduce((obj, {0: key, 1: value}) => Object.assign(obj, {[key]: value}), {});

// get feature entries
//const featureRegExp = new RegExp(`${srcPath}\/modules\/(.+)\/index\.js`);
//const featureEntryArray = glob.sync(`${srcPath}/modules/*/index.js`).map((pathname) => {
//    const res = featureRegExp.exec(pathname);
//    if (res) {
//        const filename = res[1];
//        return [`js/modules/${filename}`, path.join(jsPath, 'modules', filename, indexFilename)];
//    }
//}).reduce((obj, {0: key, 1: value}) => Object.assign(obj, {[key]: value}), {});

// get ui entries
//const uiRegExp = new RegExp(`${srcPath}\/modules\/(.+)\/UI\/index\.js`);
//const uiEntryArray = glob.sync(`${srcPath}/modules/*/UI/index.js`).map((pathname) => {
//    const res = uiRegExp.exec(pathname);
//    if (res) {
//        const filename = res[1];
//        return [`js/ui/${filename}`, path.join(jsPath, 'modules', filename, 'UI', indexFilename)];
//    }
//}).reduce((obj, {0: key, 1: value}) => Object.assign(obj, {[key]: value}), {});

module.exports = {
    watch: true,
    node: {
        global: false,
    },
    devtool: false,
    watchOptions: {
        aggregateTimeout: 1000, // milliseconds
        poll: 1000,
        ignored: ['node_modules'],
    },
    entry: pageEntryArray,
    output: {
        filename: '[name].js',
        path: buildPath,
        chunkFilename: '[name].bundle.js',
    },
    optimization: {
        splitChunks: {
            minChunks: 2,
            cacheGroups: {
                vendors: {
                    name: 'js/vendors',
                    test: /[\\/](node_modules|src\/utils|src\/_locales|src\/libs|src\/components|src\/styles)[\\/]/,
                    chunks: 'all',
                    //minChunks: 1,
                    enforce: true,
                },
                //features: {
                //    name: 'js/features',
                //    test: /src\/modules\/(.+?)\/index\.js$/,
                //    chunks: 'all',
                //    //minChunks: 1,
                //    enforce: true,
                //},
            },
        },
    },
    resolve: {
        alias: {
            'Libs': path.resolve(jsPath, 'libs'),
            'Utils': path.resolve(jsPath, 'utils'),
            'Components': path.resolve(jsPath, 'components'),
            'Modules': path.resolve(jsPath, 'modules'),
            'Static': path.resolve(srcPath, 'static'),
            'Styles': path.resolve(srcPath, 'styles'),
        },
        mainFiles: ['index'],
        extensions: ['.jsx', '.js', '.json', '.css', '.less', '.scss', '.sass'],
    },
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                exclude: /(\/node_modules\/|\/modules\/|\.min\.js\/)/,
                loader: 'eslint-loader',
                options: {
                    emitError: true,
                    failOnError: true,
                    fix: true,
                },
            },
            {
                test: /\.js$/,
                exclude: /(\/node_modules\/|\.min\.js\/)/,
                include: /(\/src\/)/,
                loaders: [
                    'babel-loader',
                ],
            },
            {
                test: /\.(css|scss|sass)$/,
                use: [
                    {loader: MiniCssExtractPlugin.loader},
                    {loader: 'css-loader'},
                    {loader: 'sass-loader'},
                ],
            },
        ],
    },
    plugins: [
        new webpack.EnvironmentPlugin(require('./env')),
        new CleanWebpackPlugin([buildPath], {
            verbose: false,
        }),
        new MiniCssExtractPlugin({
            filename: path.join('styles', '[name].css'),
            chunkFilename: path.join('styles', '[name].css'),
        }),
        new CopyWebpackPlugin([
            {from: 'src/pages/**/*.html', to: '[1].html', test: /([^/]+)\/index\.html$/, flatten: true},
            {from: 'src/pages/**/*.css', to: '[1].css', test: /([^/]+)\/style\.css$/, flatten: true},
            {from: 'src/static', to: 'static'},
        ]),
        new MergeJsonWebpackPlugin({
            debug: true,
            output: {groupBy: localesGroup},
        }),
        new WriteJsonPlugin({
            object: manifestJSON,
            path: '../src/',
            filename: 'manifest.json',
            pretty: true,
        }),
        new WriteJsonPlugin({
            object: manifestJSON,
            path: '/',
            filename: 'manifest.json',
        }),
        new WriteJsonPlugin({
            object: packageJSON,
            path: '../',
            filename: 'package.json',
            pretty: true,
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        //new BundleAnalyzerPlugin(),
    ],
};
