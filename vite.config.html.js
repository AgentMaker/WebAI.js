const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      return html.replace(/="\//g, '="./')
    }
  }
}

export default {
  plugins: [
    htmlPlugin()
  ],
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