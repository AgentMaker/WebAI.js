const path = require('path')

module.exports = {
    entry: './index_min.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webai.min.js'
    },
}