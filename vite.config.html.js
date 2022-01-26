export default {
  define: {
    BUILD: true
  },
  build: {
    outDir: './docs',
    assetsDir: './',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`
      }
    }
  }
}