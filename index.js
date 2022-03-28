const Koa = require('koa')
const app = new Koa()
const fs = require('fs')
const path = require ('path')
app.use(async ctx=>{
  // 从ctx.request中取出请求的url
  const {url,query} = ctx.request
  if (url==='/') {
    // 返回文件的类型
    ctx.type = 'text/html'
    let content = fs.readFileSync('./index.html','utf-8')
    // vue运行的时候会调用环境变量 加环境变量
    content = content.replace('<script',`
      <script>
        windown.process={env:{
          NODE_ENV:'dev'
        }}
      </script>
      <script
    `)
    ctx.body = content
  }else if (url.endsWith('.js')) {
    // main.js的请求路径为  /src/main.js 需要转换为相对路劲
    const p = path.resolve(__dirname,url.slice(1))
    console.log('p: ', p);
    const content = fs.readFileSync(p,'utf-8')
    ctx.type = 'application/javascript'
    ctx.body = rewritePath(content)
  }else if(url.startsWith('/@modules')){
    // 转换url
    // /@modules/vue => 代码的位置/node_modules/vue 的es模块入口
    // 定义路径前缀
    console.log("url",url.replace("/@modules/",""));
    const prefix = path.resolve(__dirname,'node_modules',url.replace("/@modules/",""))
    console.log('prefix: ', prefix);
    // 找到对应文件路径
    const module = require(prefix + '/package.json').module
    console.log('module: ', module);
    // 拼接最终入口文件地址
    const p = path.resolve(prefix,module)
    const content = fs.readFileSync(p,'utf-8')
    ctx.type='application/javascript'
    ctx.body = rewritePath(content)
  }


  // 改写文件引用路径函数
  // import {***}  from '**' =>  import {***}  from '/@modules/**'
  function rewritePath(content){
    const resultContent= content.replace(/ from ['|"]([^'"]+)['|"]/g, function(s0,s1){
      if (s1[0] !=='.' || s1[0] !=='/') {
        // 如果不是 ./ 或者 / 开头的路径
        return ` from '/@modules/${s1}'`
      }else{
        return s0
      }
    })
    return resultContent
  }
})
app.listen(3000,()=>{
  console.log('server start at 3000');
})