import Vue from 'vue';
import App from './App.vue';
import './scss/index.scss';
import { loading } from './components/loading';
import { on, matchTarget, query, createElement, one, queryAll } from './utils/dom';
import { isString, isFunction } from './utils/util';
import { dropdown } from './components/dropdown';
import { modal } from './components/modal';
import { confirm } from './components/confirm';
import { select } from './components/select';
import './components/backtop';
import { tooltip } from './components/tooltip';

window.loading = loading;

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
  mounted() {
    queryAll('[wx-toggle="tooltip"]').forEach(item => {
      tooltip(item, {
        content: item.getAttribute('wx-content') || item.getAttribute('data-content') || item.getAttribute('title')
      });
    })
  }
}).$mount('#app');

on(document, 'change', e => {
  console.log(e);
});

// on(document, 'change', e => {
//   console.log(e);
// });

on(document, 'click', e => {
  const target = matchTarget(e.target, '[data-toggle]');
  if(target) {
    const toggle = target.getAttribute('data-toggle');
    if(toggle === 'dropdown') {
      window.test_dropdown = target._dropdown = dropdown(target, query('.wx-dropdown__popper', target.parentNode), {
        // onChange: cmd => {
        //   console.log('cmd: ', cmd);
        // }
      });
      // let options = 'toggle';
      // if(isString(options) && isFunction(target._dropdown[options])) {
      //   target._dropdown[options]();
      // }
    } else if(toggle === 'custom-dropdown') {
      if(!target._customDropdown) {
        target._customDropdown = dropdown(target, query(target.getAttribute('data-target')), {
          backdrop: true,
          closeOnClick: true,

        });
        target._select = select('#popperModal1_select', { 
          filterable: true,
          static: true
        });
        window._select = target._select;
      }
      target._customDropdown.toggle();
    } else if(toggle === 'modal') {
      if(!target._modal) {
        target._modal = modal(query(target.getAttribute('data-target')));
        on(target._modal.$el, 'open', () => {
          console.log('open');
        })
        on(target._modal.$el, 'opened', () => {
          console.log('opened');
        })
        on(target._modal.$el, 'close', () => {
          console.log('close');
        })
        on(target._modal.$el, 'closed', () => {
          console.log('closed');
        })
      }
      target._modal.toggle();
    } else if(toggle === 'aaa') {
      var referenceElm = target;
      var dom = createElement('div');
      var popperElm = createElement('div', {
        'class': 'wx-popper wx-dropdown__popper'
      }, [ dom ]);
      window._aaa_ = dropdown(referenceElm, popperElm, {
        placement: 'bottom-end',
        destroyOnClose: true
      });
      one(referenceElm, 'open', function() {
        window.selectInstance = select(dom, {
          static: true,
          labelField: 'username',
          valueField: 'id',
          popperClass: '',
          data: [
            {
              "id": 1,
              "email": "liqiang@china-revival.com",
              "username": "李强",
              "desc": "1",
              "admin": true,
              "contact": "liqiang@china-revival.com",
              "created_at": "2020-02-17T16:36:54.000+08:00",
              "updated_at": "2020-03-13T13:28:41.000+08:00"
            },
            {
              "id": 3,
              "email": "liuxinyu@china-revival.com",
              "username": "刘新宇",
              "desc": "",
              "admin": true,
              "contact": "liuxinyu@china-revival.com",
              "created_at": "2020-02-17T17:27:14.000+08:00",
              "updated_at": "2020-02-19T14:46:41.000+08:00"
            },
            {
              "id": 4,
              "email": "wangdexu@china-revival.com",
              "username": "王徳旭",
              "desc": "",
              "admin": true,
              "contact": "wangdexu@china-revival.com",
              "created_at": "2020-02-17T17:28:18.000+08:00",
              "updated_at": "2020-03-15T20:38:57.000+08:00"
            },
            {
              "id": 5,
              "email": "xiaomengting@china-revival.com",
              "username": "肖梦婷",
              "desc": "",
              "admin": true,
              "contact": "xiaomengting@china-revival.com",
              "created_at": "2020-02-17T17:29:01.000+08:00",
              "updated_at": "2020-03-12T17:13:50.000+08:00"
            },
            {
              "id": 6,
              "email": "wangxiong@china-revival.com",
              "username": "王雄",
              "desc": "",
              "admin": true,
              "contact": "wangxiong@china-revival.com",
              "created_at": "2020-02-17T17:48:26.000+08:00",
              "updated_at": "2020-03-17T10:27:00.000+08:00"
            },
            {
              "id": 7,
              "email": "peiyanqing@china-revival.com",
              "username": "裴燕青",
              "desc": "",
              "admin": false,
              "contact": "peiyanqing@china-revival.com",
              "created_at": "2020-02-20T20:58:18.000+08:00",
              "updated_at": "2020-03-12T16:37:58.000+08:00"
            },
            {
              "id": 8,
              "email": "wangxuefeng@china-revival.com",
              "username": "王雪峰",
              "desc": "",
              "admin": true,
              "contact": "wangxuefeng@china-revival.com",
              "created_at": "2020-03-04T19:42:55.000+08:00",
              "updated_at": "2020-03-04T19:43:22.000+08:00"
            }
          ],
          onChange: function(data) {
            console.log(data);
            window._aaa_.close();
          }
        })
      });
      one(referenceElm, 'closed', function() {
        window.selectInstance && window.selectInstance.destroy();
        window.selectInstance = null;
        window._aaa_ = null;
      });
      window._aaa_.open();
    }
  }
});

window.gConfirm = confirm;