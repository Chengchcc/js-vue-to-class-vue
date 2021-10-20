# js-vue-to-class-vue
为了解决vue从js迁移到ts后的问题
利用ts-morph将js形式的vue sfc转换成class形式的sfc

## 测试
运行
```bash
yarn start --input test --output output
```
test目录下的.vue文件会被转化保存到output目录下

**data转换前**

```js
export default {
    data(){
        return {
            active: false,
            toggleAnimate: false,
            toggleColor: false
        }
    }
}
```

转换后

```js
import { Vue, Component, Prop, Watch } from "vue-property-decorator"; // <-- adde

@Component()
export default App extend Vue {
    active: boolean;  // <-- added
    toggleAnimate: boolean; // <-- added
    toggleColor: boolean; // <-- added

    // 考虑到js写法中data钩子里面有很多逻辑，故还是保留这个钩子
    data() {
        return {
            active: false,
            toggleAnimate: false,
            toggleColor: false
        }
    }
}
```

**prop转换前**

```js
export default {
   props: {
    animate: String,
    color: String
  }
}
```

转换后

```js
@Component()
export default App extend Vue {
    @Prop({ type: String })
    animate: string;
    @Prop({ type: String })
    color: string;
}
```

**computed转换前**

```js
export default {
   computed: {
    AnimateClass () {
      return this.toggleAnimate ? this.animate : ''
    },
    ColorValue () {
      return this.toggleColor ? this.color : ''
    }
  }
}
```
转换后

```js
@Component()
export default App extend Vue {
    get AnimateClass() {
        return this.toggleAnimate ? this.animate : ''
    }

    get ColorValue() {
        return this.toggleColor ? this.color : ''
    }
}
```
**watch转换前**

```js
export default {
  watch: {
      active(){
          console.log(this.toggleAnimate)
      }
  }
}
```
转换后

```js
@Component()
export default App extend Vue {
    @Watch("active")
    onActiveChange() {
        console.log(this.toggleAnimate)
    }
}
```

**method转换前**

```js
export default {
   methods: {
    toggle () {
      this.active = !this.active
      this.toggleAnimate = !this.toggleAnimate
      this.toggleColor = !this.toggleColor
    }
  },
}
```
转换后

```js
@Component()
export default App extend Vue {
  toggle() {
        this.active = !this.active
        this.toggleAnimate = !this.toggleAnimate
        this.toggleColor = !this.toggleColor
    }
}

```
生命钩子函数还是保留

