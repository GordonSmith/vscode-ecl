/* eslint-disable */

const { DefinePlugin } = require("webpack");
const path = require("path");

const makeConfig = (argv, { entry, out, target, library = "commonjs" }) => ({
    mode: argv.mode,
    devtool: argv.mode === "production" ? false : "inline-source-map",
    entry,
    target,
    output: {
        path: path.join(__dirname, path.dirname(out)),
        filename: path.basename(out),
        publicPath: "",
        libraryTarget: library,
        chunkFormat: library,
    },
    resolve: {
        extensions: [".js", ".jsx", ".css"],
    },
    externals: {
        vscode: "commonjs vscode" // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    experiments: {
        outputModule: true,
    },
    module: {
        rules: [
            // Allow importing CSS modules:
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 1,
                            modules: true,
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new DefinePlugin({
            // Path from the output filename to the output directory
            __webpack_relative_entrypoint_to_root__: JSON.stringify(
                path.posix.relative(path.posix.dirname("/index.js"), "/"),
            ),
            scriptUrl: "import.meta.url",
        }),
    ],
});

/**@type {import('webpack').Configuration}*/
const config = [{
    target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

    entry: {
        extension: "./lib-es6/extension.js",
        debugger: "./lib-es6/debugger.js"
    },

    output: { // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        libraryTarget: "commonjs2",
        globalObject: "this",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: "source-map",

    externals: {
        vscode: "commonjs vscode" // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },

    module: {
        rules: [{
            test: /\.js$/,
            use: ["source-map-loader"],
            enforce: "pre"
        }]
    },

    resolve: {
        fallback: {
            "@hpcc-js/comms": path.resolve(__dirname, "../hpcc-js/packages/comms/dist/index.node.js"),
            "@hpcc-js": path.resolve(__dirname, "../hpcc-js/packages")
        }
    },

    plugins: []
}, {
    target: "web", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

    entry: {
        eclwatch: "./lib-es6/eclwatch.js"
    },

    output: { // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        libraryTarget: "umd",
        globalObject: "this",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },

    devtool: "source-map",

    externals: {
        vscode: "commonjs vscode" // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },

    module: {
        rules: [{
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
        }, {
            test: /\.js$/,
            use: ["source-map-loader"],
            enforce: "pre"
        }]
    },

    resolve: {
        fallback: {
            "@hpcc-js": path.resolve(__dirname, "../hpcc-js/packages")
        }
    },

    plugins: []
},
];

module.exports = config;

module.exports = (env, argv) => [
    ...config,
    makeConfig(argv, { entry: './lib-es6/renderer.js', out: './dist/renderer.js', target: 'web', library: 'module' }),
    // makeConfig(argv, { entry: './lib-es6/extension.js', out: './dist/extension.js', target: 'node' }),
    // makeConfig(argv, { entry: './src/extension/extension.ts', out: './out/extension/extension.web.js', target: 'webworker' }),
];