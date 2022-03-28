
import {createApp,h } from 'vue'

const App={
  render(){
    return h('div',null,h('div',null,String('Hello Vite')))
  }
}
createApp(App).mount('#app')