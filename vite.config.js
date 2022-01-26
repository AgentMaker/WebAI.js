export default {
    build: {
        lib: {
            entry: './index.js',
            formats: ['es']
        },
        rollupOptions: {
          output: {
            entryFileNames: `webai.min.js`
          }
        }
    }
}