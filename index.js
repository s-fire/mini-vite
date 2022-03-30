const Koa = require('koa')
const app = new Koa()
const fs = require('fs')
const path = require('path')
const compilerSfc = require('@vue/compiler-sfc')
const compilerDom = require('@vue/compiler-dom')
app.use(async ctx => {
  // 从ctx.request中取出请求的url
  const { url, query } = ctx.request
  if (url === '/') {
    // 返回文件的类型
    ctx.type = 'text/html'
    let content = fs.readFileSync('./index.html', 'utf-8')
    // vue运行的时候会调用环境变量 加环境变量
    content = content.replace('<script', `
      <script>
        window.process={env:{
          NODE_ENV:'dev'
        }}
      </script>
      <script
    `)
    ctx.body = content
  } else if (url.endsWith('.js')) {
    // main.js的请求路径为  /src/main.js 需要转换为相对路劲
    const p = path.resolve(__dirname, url.slice(1))
    const content = fs.readFileSync(p, 'utf-8')
    ctx.type = 'application/javascript'
    ctx.body = rewriteImport(content)
  } else if (url.startsWith('/@modules')) {
    // 转换url
    // /@modules/vue => 代码的位置/node_modules/vue 的es模块入口
    // 定义路径前缀
    const prefix = path.resolve(__dirname, 'node_modules', url.replace("/@modules/", ""))
    // 找到对应文件路径
    const module = require(prefix + '/package.json').module
    console.log('module: ', module);
    // 拼接最终入口文件地址
    const p = path.resolve(prefix, module)
    const content = fs.readFileSync(p, 'utf-8')
    ctx.type = 'application/javascript'
    ctx.body = rewriteImport(content)
  } else if (url.indexOf('.vue') > -1) {
    console.log('url: ', url);
    // 先从vue文件文件内解析出template script（compiler-sfc）
    //此时的路径有可能是加载compiler-dom的 ?type=template 所以需要先截取
    const p = path.resolve(__dirname, url.split('?')[0].slice(1))
    console.log('p: ', p);
    const ret = compilerSfc.parse(fs.readFileSync(p, 'utf-8'))
    console.log('ret: ', ret);
    // console.log('ret: ', ret);
    if (!query.type) {
      // 只是加载.vue文件
      // 返回解析后的文件内容
      /* 
          1、将export default 替换为 const _script =
          2、调用rewriteImport  重新解析单文件组件内的引用文件
          3、插入一段引入compiler-dom 的代码来编译解析dom
          4、将第三步引入的render函数挂到_script上
          5、导出 _script  
      */
      ctx.type = 'application/javascript'
      ctx.body = `${rewriteImport(
        ret.descriptor.script.content.replace("export default ", "const _script= ")
      )}
      import {render as _render } from "${url}?type=template"
      _script.render = _render
      export default _script
      `;
    }else{
      // 此时的请求是在上面的条件判断里生成的代码里手动加入的应用,其路径后缀为?type=template
      // 将template 模板解析为 render (compiler-dom)
      const template = ret.descriptor.template
      const render = compilerDom.compile(template.content,{mode:'module'})
      ctx.type='application/javascript'
      ctx.body = rewriteImport(render.code)
    }
  }


  // 改写文件引用路径函数
  // import {***}  from '**' =>  import {***}  from '/@modules/**'
  function rewriteImport(content) {
    const resultContent = content.replace(/ from ['|"]([^'"]+)['|"]/g, function (s0, s1) {
      if (s1[0] !== '.' && s1[0] !== '/') {
        // 如果不是 ./ 或者 / 开头的路径
        return ` from '/@modules/${s1}'`
      } else {
        return s0
      }
    })
    return resultContent
  }
})
app.listen(3000, () => {
  console.log('server start at 3000');
})