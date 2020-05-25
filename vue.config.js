module.exports = {
  // configureWebpack: {
  //   entry: './src/test1.js'
  // },
  devServer: {
    setup(app) {
      app.post('/upload', function(req, res) {
        console.log(req, res);

        res.json({ type: 'success', message: 'upload success!' });
      });
    },
    proxy: {
      '/imaps/images': {
        target: 'http://imaps.china-revival.com/',
        changeOrigin: true,
        pathRewrite: {
          '^/imaps/images': '/profile_images'
        }
      },
      '/api/map_suggest': {
        target: 'http://map.baidu.com/',
        changeOrigin: true,
        pathRewrite: {
          '^/api/map_suggest': '/su?wd=a&cid=218&type=0&newmap=1&b=(12722228.522000005%2C3530791.0754285725%3B12760733.702857146%2C3560052.5145714283)&t=1577153564685&pc_ver=2'
        }
      },
      // '/api/map_search': {
      //   target: 'http://map.baidu.com/',
      //   changeOrigin: true,
      //   pathRewrite: {
      //     '^/api/map_search': '/su?wd=a&cid=218&type=0&newmap=1&b=(12712753.317164686%2C3530995.958492126%3B12755978.921962425%2C3564496.696040083)&t=1577089972042&pc_ver=2'
      //   }
      // }
    }
  }
}