'use strict';

const webpack = require( 'webpack' );
const path = require( 'path' );

const nodeModulesPath = path.resolve( __dirname, 'node_modules' );

const config = {
    context: __dirname,
    entry: {
        index: './test/index.js',
    },
    output: {
        path: 'test/compiled',
        filename: '[name].min.js',
        publicPath: path.resolve( __dirname, 'src/public/' ),
    },
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel', exclude: [nodeModulesPath] },
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            backbone: 'backbone',
            underscore: 'lodash',
        }),
    ],
    resolve: {
        fallback: path.resolve( __dirname, 'node_modules' ),
    },
};

module.exports = config;
