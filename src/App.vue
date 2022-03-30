<template>
  <div>
    {{count}}
  </div>
  <button @click='count++'>点击</button>
</template>
<script>
import {ref} from 'vue'
export default {
  setup() {
    const count = ref(0)
    return {
      count
    }
  }
}
</script>
<style lang="">
  
</style>