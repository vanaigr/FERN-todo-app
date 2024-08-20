const path = require('path')
const webpack = require('webpack')

const srcDir = path.resolve(__dirname, 'src')

const config = {
    mode: 'development',
    stats: 'errors-warnings',
    devtool: 'cheap-module-source-map',
    entry: './src/index.js',
    output: { path: path.resolve(__dirname, 'build') },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: srcDir,
                loader: require.resolve('babel-loader'),
                options: {
                    sourceMaps: true,
                    presets: [
                        [ // https://babeljs.io/docs/babel-preset-react
                            require('@babel/preset-react').default,
                            {
                                development: true,
                                runtime: "automatic", // https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html
                            },
                        ],
                    ],
                },
            },
            {
                test: /\.css$/,
                include: srcDir,
                use: ['style-loader', 'css-loader'],
            }
        ],
    },
}

const compiler = webpack(config)
compiler.run((err, stats) => {
    try {
        if(err) {
            console.error(err)
            return
        }

        const res = stats.toJson()
        if(stats.hasWarnings()) {
            res.warnings.forEach(it => {
                console.warn(it.moduleName + ':' + it.loc + ' - warning:')
                console.warn(it.message)
            })
        }

        if(stats.hasErrors()) {
            res.errors.forEach(it => {
                console.warn(it.moduleName + ':' + it.loc + ' - error:')
                console.warn(it.message)
            })
        }

        console.log('')
        console.log('Finished in ' + (res.time * 0.001) + 's')
    }
    finally {
        compiler.close(err => {})
    }
})
