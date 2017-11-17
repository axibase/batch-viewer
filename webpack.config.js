var path = require("path");
var process = require("process");
var webpack = require("webpack");

const ExtractTextPlugin = require("extract-text-webpack-plugin");

var Mode;

(function (Mode) {
    Mode[Mode["DEBUG"] = 0] = "DEBUG";
    Mode[Mode["RELEASE"] = 1] = "RELEASE";
})(Mode || (Mode = {}));

(function (Mode) {
    function isProduction() {
        return process.argv.indexOf("-p") >= 0
            || process.env.NODE_ENV === "production";
    }
    Mode.current = isProduction() ? Mode.RELEASE : Mode.DEBUG;
    Mode.isDebug = Mode.current === Mode.DEBUG;
    Mode.isRelease = Mode.current === Mode.RELEASE;
})(Mode || (Mode = {}));

console.log("Building mode:", Mode[Mode.current]);

var devPlugins = Mode.isRelease ? [] : [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
        __debug: "true",
        __release: "false"
    })
];

var prodPlugins = Mode.isDebug ? [] : [
    new webpack.DefinePlugin({
        __debug: "false",
        __release: "true"
    }),
    new ExtractTextPlugin("default.css"),
];

module.exports = {
    entry: {
        "app": "./src/main.tsx",
        "polyfills": "./src/polyfills/index.ts",
        "index": "./src/index.html",
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "./build"),
        publicPath: "/portal/resource/batch/"
    },
    devtool: "source-map",
    resolve: {
        extensions: [".js", ".json", ".ts", ".tsx"],
    },
    externals: {
        "jquery": "jQuery",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                options: {
                    module: "es6"
                }
            },
            {
                test: /\.js$/,
                loader: "source-map-loader",
                enforce: "pre"
            },
            {
                test: /\.js$/,
                loader: "babel-loader",
                include: /(charts)/,
                exclude: /(components|\.min\.)/,
                options: {
                    presets: ["es2015"]
                }
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: {
                        loader: "css-loader",
                        options: {
                            sourceMap: true
                        }
                    }
                })
            },
            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: true
                            }
                        },
                        {
                            loader: "less-loader",
                            options: {
                                sourceMap: true
                            }
                        },
                    ]
                })
            },
            {
                test: /\.(eot|svg|ttf|TTF|woff|woff2|png)$/,
                loader: "file-loader",
                options: {
                    name: "[name].[ext]",
                    outputPath: "assets/"
                }
            },
            {
                test: /\.html$/,
                loader: "file-loader",
                options: {
                    name: "[name].[ext]",
                    outputPath: "/"
                }
            },
        ]
    },
    devServer: {
        contentBase: path.resolve(__dirname, "./build"),
        hot: true,
        inline: true,
        port: 8080
    },
    plugins: devPlugins.concat(prodPlugins, [
        new webpack.ProvidePlugin({
            crossfilter: "crossfilter",
        }),
    ])
};
