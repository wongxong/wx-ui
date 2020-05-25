<template>
  <div id="app">
    <div class="wx-backtop" wx-toggle="backtop" style="display: none;position: fixed; right: 20px; bottom: 100px">top</div>
    <div class="wx-upload" id="ddd">
      <div class="wx-upload__control">
        <input type="file" name="file">
      </div>
    </div>
    
    <button wx-toggle="tooltip" data-content="hello tooltip!">tootip this</button>
    <div class="wx-select"></div>
    <!-- <div class="wx-suggest">
      <div class="wx-suggest__reference">
        <input type="text" class="wx-suggest__input" ref="bb">
        <span class="wx-suggest__suffix">
          <span class="wx-suggest__clear">×</span>
        </span>
      </div>
    </div> -->
    <select name="" multiple ref="test">
      <template v-for="item in dataArray.slice(0, 10)">
        <option 
          :value="item.value" 
          :key="item.value" 
          :selected="item.selected"
          :disabled="item.disabled">{{ item.text }}</option>
      </template>
    </select>
    <div class="test-box" style="height: 400px;background: pink;overflow: auto">
      <div style="height: 600px"></div>
      <div class="wx-dropdown">
        <div class="wx-dropdown__reference" data-toggle="dropdown">click me dropdown</div>
        <div class="wx-popper wx-dropdown__popper">
          <ul class="wx-dropdown__list">
            <li class="wx-dropdown__list-item" command="html">
              <a href="#/html">html</a>
            </li>
            <li class="wx-dropdown__list-item" command="javascript">
              <a href="#/javascript">javascript</a>
            </li>
            <li class="wx-dropdown__list-item" command="css">
              <a href="#/css">css</a>
            </li>
            <li class="wx-dropdown__list-item" command="java">
              <a href="#/java">java</a>
            </li>
            <li class="wx-dropdown__list-item" command="node">
              <a href="#/node">node</a>
            </li>
            <li class="wx-dropdown__list-item" command="ruby">
              <a href="#/ruby">ruby</a>
            </li>
            <li class="wx-dropdown__list-item" command="python">
              <a href="#/python">python</a>
            </li>
            <li class="wx-dropdown__list-item" command="rails">
              <a href="#/rails">rails</a>
            </li>
          </ul>
        </div>
      </div>
      <div style="height: 600px"></div>
    </div>
    <div class="wx-collapse effect-accordion">
      <div class="wx-collapse-item active">
        <div class="wx-collapse-item__header">collapse-1</div>
        <div class="wx-collapse-item__body">
          collapse-body-1
          <br>
          collapse-body-1
          <br>
          collapse-body-1
          <br>
          collapse-body-1
          <br>
          collapse-body-1
          <br>
          collapse-body-1
        </div>
      </div>
      <div class="wx-collapse-item">
        <div class="wx-collapse-item__header">collapse-2</div>
        <div class="wx-collapse-item__body">
          collapse-body-2
          <br>
          collapse-body-2
          <br>
          collapse-body-2
          <br>
          collapse-body-2
          <br>
          collapse-body-2
          <br>
          collapse-body-2
        </div>
      </div>
      <div class="wx-collapse-item">
        <div class="wx-collapse-item__header">collapse-3</div>
        <div class="wx-collapse-item__body">
          collapse-body-3
          <br>
          collapse-body-3
          <br>
          collapse-body-3
          <br>
          collapse-body-3
          <br>
          collapse-body-3
          <br>
          collapse-body-3
        </div>
      </div>
    </div>
    <div class="wx-select" id="aaa">
      <div class="wx-select__reference">
        <input type="text" class="wx-select__input" placeholder="请选择">
      </div>
      <div class="wx-popper wx-select__popper">
        <ul class="wx-select__list"></ul>
      </div>
    </div>
    <div data-toggle="custom-dropdown" data-target="#popperModal1">custom dropdown</div>
    <div class="wx-popper wx-dropdown__popper" id="popperModal1">
      <select id="popperModal1_select">
        <template v-for="item in dataArray.slice(10, 30)">
          <option 
            :value="item.value" 
            :key="item.value" 
            :selected="item.selected"
            :disabled="item.disabled">{{ item.text }}</option>
        </template>
      </select>
    </div>

    <button data-toggle="aaa">click me</button>

    <div class="td-command-dropdown">
      <a href="javascript: void(0)" class="td-command__reference">
        <i class="icon_data_analysis icon-more">...</i>
      </a>
      <div class="td-command__popper">
        <ul class="td-command__list">
          <li class="td-command__list-item">
            <a href="/dump_files/<%= x.id %>/export" class="js-single-export">导出</a>
          </li>
          <li class="td-command__list-item">
            <a href="/dump_files/<%= x.id %>" 
              data-command="delete" 
              data-method="delete">删除</a>
          </li>
        </ul>
      </div>
    </div>

    

    <div>
      <button type="button" data-toggle="modal" data-target="#modal1">点击打开 modal</button>
    </div>


    <div class="wx-modal" id="modal1">
      <div class="wx-modal-dialog" style="width: 30%">
        <div class="wx-modal__header">
          <h5 class="wx-modal__title">提示</h5>
          <button class="wx-close wx-modal__headerBtn" type="button" data-dismiss="modal"></button>
        </div>
        <div class="wx-modal__body">这是一段信息</div>
        <div class="wx-modal__footer">footer</div>
      </div>
    </div>
  </div>
</template>

<script>
  import dataArray from './components/select/data.json';
  import { Select } from './components/select';
  import { Suggest } from './components/suggest';
  import { dropdown } from './components/dropdown';
  import { modal } from './components/modal';
  import { query } from './utils/dom';
  import { Upload } from './components/upload';
  import { collapse } from './components/collapse';
 
  export default {
    name: 'app',
    data() {
      return {
        dataArray: dataArray
      }
    },
    methods: {
      openModal() {
        var aa = modal('.wx-modal');
        aa.open();
      }
    },
    mounted() {
      collapse(query('.wx-collapse'));
      window.uploader = new Upload('#ddd', {
        url: '/upload',
        fileList: [
          { 
            name: 'aa.jpg',
            url: 'http://ams.china-revival.com/person_images/c7f76e7adf804b4cadf3eef5dc14b968.jpg' 
          },
          { 
            name: 'IMG_2934.jpg',
            url: 'http://ams.china-revival.com/person_images/IMG_2934.JPG' 
          }
        ],
        onClick(method) {
          console.log(method)
        },
        onProgress(e, file, fileList) {
          console.log(e.percent)
        },
        onChange(file, fileList) {
          console.log(file, fileList)
        }
      });
      window.dataArray = dataArray;
      // window.aaa = new Select(query('#aaa'), {
      //   data: dataArray,
      //   static: true
      // });
      // window.bb = new Suggest(this.$refs['bb'], {
      //   // data: JSON.parse(JSON.stringify(dataArray)).slice(0, 10),
      //   onChange: function(data) {
      //     console.log(data);
      //   },
      //   remote: (params, next) => {
      //     console.log(params)
      //     setTimeout(() => {
      //       next(JSON.parse(JSON.stringify(dataArray)).filter(item => {
      //         return item.text.indexOf(params.q) > -1;
      //       }));
      //     }, 2000);
      //   }
      // });
      window.aa = new Select(this.$refs['test'], {
        // static: true,
        // data: dataArray,
        onChange: (data) => {
          console.log('onChange: ', data);
        },
        onCreate: (data) => {
          console.log('onCreate: ', data);
        }
      });

      // window.instance11 = dropdown('.wx-dropdown', {
      //   onChange: cmd => {
      //     console.log(cmd);
      //   }
      // });

      function range(min, max) {
        let start = Math.floor(Math.random() * (max - min) + min);
        let end;

        while(!end || start === end) {
          end = Math.floor(Math.random() * (max - min) + min);
        }

        console.log(start, end);

        return start < end ? [ start, end ] : [ end, start ];
      }
    }
  }
</script>

<style lang="scss">
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    // text-align: center;
    color: #2c3e50;
    // margin-top: 60px;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    min-height: 100%;
  }

  #app,
  #container {
    min-height: inherit;
  }

  #app {
    padding: 1000px 100px;
  }

  .progress-bar {
    width: 0;
    transition: width .2s;
  }

  .wx-select__dropdown {
    position: absolute;
    overflow: auto;
    max-height: 360px;
  }
</style>
