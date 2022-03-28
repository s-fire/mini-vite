const Koa = require('koa')
const app = new Koa()
const fs = require('fs')
const path = require ('path')
app.use(async ctx=>{
  // 从ctx.request中取出请求的url
  const {url,query} = ctx.request
  console.log('url: ', url);
  if (url==='/') {
    // 返回文件的类型
    ctx.type = 'text/html'
    const content = fs.readFileSync('./index.html','utf-8')
    ctx.body = content
  }else if (url.endsWith('.js')) {
    // main.js的请求路径为  /src/main.js 需要转换为相对路劲
    const p = path.resolve(__dirname,url.slice(1))
    const content = fs.readFileSync(p,'utf-8')
    ctx.type = 'application/javascript'
    ctx.body = content
  }
})
app.listen(3000,()=>{
  console.log('server start at 3000');
})