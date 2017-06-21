import * as path from "path";
import * as process from "process";
import * as webpack from "webpack";

enum Mode { DEBUG, RELEASE }

namespace Mode {
    function isProduction() {
        return process.argv.indexOf("-p") >= 0 
            || process.env.NODE_ENV === "production";
    }
    export const current   =  isProduction() ? Mode.RELEASE : Mode.DEBUG;
    export const isDebug   = current === Mode.DEBUG;
    export const isRelease = current === Mode.RELEASE;
}

console.log("Building mode:", Mode[Mode.current]);


const devPlugins = Mode.isRelease ? [] : [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
        __debug: "true",
        __release: "false",
    })
]

const prodPlugins = Mode.isDebug ? [] : [
    new webpack.DefinePlugin({
        __debug: "false",
        __release: "true",
    }),
]

const config: webpack.Configuration = {
    entry: {
        "app": "./src/main.tsx",
        "es6-shim": "es6-shim",
        // sandbox: "./src/sandbox.tsx",
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "./build"),
        publicPath: "/",
    },
    devtool: "source-map",
    resolve: {
        extensions: [".js", ".json", ".ts", ".tsx"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                options: {
                    module: "es6",
                },
            },
            {
                test: /\.js$/,
                loader: "source-map-loader",
                enforce: "pre",
            },
            {
                test: /\.js$/,
                loader: "babel-loader",
                include: /(charts)/,
                exclude: /(components|\.min\.)/,
                options: {
                    presets: ["es2015"],
                },
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: "style-loader",
                    },
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true,
                        }
                    },
                ]
            },
            {
                test: /\.less$/,
                use: [
                    {
                        loader: "style-loader",
                    },
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true,
                        }
                    },
                    {
                        loader: "less-loader",
                        options: {
                            sourceMap: true,
                        }
                    },
                ],
            },
            {
                test: /\.(eot|svg|ttf|TTF|woff|woff2|png)$/,
                loader: "file-loader",
                options: {
                    name: "[name].[ext]",
                    // publicPath: "/assets/",
                    outputPath: "assets/",
                },
            },
        ],
    },
    devServer: {
        contentBase: path.resolve(__dirname, "./build"),
        hot: true,
        // historyApiFallback: true,
        inline: true,
        port: 9000,
    },
    plugins: [
        ...devPlugins,
        ...prodPlugins,
        new webpack.ProvidePlugin({
            $: "jquery",
            crossfilter: "crossfilter",
            d3: "d3",
            jQuery: "jquery",
        }),
    ],
}

export default config;
