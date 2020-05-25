import { query, on, off, createElement, addClass, removeClass, queryAll, removeNode, matchTarget, closest } from '../../utils/dom';
import extend from '../../utils/extend';
import { uploadAjax } from './xhr';
import { guid, isFunction, isUndef } from '../../utils/util';

export class Upload {
  constructor(el, options) {
    this.$el = query(el);
    if(!this.$el) {
      throw new Error('[ Upload ]: el must be a HTMLElement.')
    }
    this.$field = query('[type="file"]', this.$el);
    if(!this.$field) {
      throw new Error('[ Upload ]: field must be a file-input Element.')
    }
    this._options = this._getOptions(options);
    this.setupTemplates();
    this.init();
  }

  _getOptions(options) {
    const customOptions = {};
    const accept = this.$field.getAttribute('accept');

    if(this.$field.name) {
      customOptions.name = this.$field.name;
      this.$field.name = '';
      this.$field.setAttribute('org-name', customOptions.name);
    }
    customOptions.multiple = this.$field.multiple;
    customOptions.disabled = this.$field.disabled;
    
    if(!isUndef(accept)) {
      customOptions.accept = accept;
    }

    if(this.$el.tagName.toUpperCase() === 'FORM') {
      if(!isUndef(this.$el.getAttribute('action'))) {
        customOptions.url = this.$el.action;
      }
    }

    return extend({
      name: 'file',
      url: '',
      data: null,
      headers: null,
      withCredentials: false,
      limit: 0,
      multiple: false,
      disabled: false,
      autoUpload: true,
      accept: '',
      listType: 'picture', // text || picture || picture-card
      fileList: [],
      onExceed: null,
      onChange: null,
      onProgress: null,
      onSuccess: null,
      onError: null,
      onClick: null,
      beforeUpload: null,
      httpRequest: uploadAjax,
      customClass: '',
      renderItem: null,
      renderProgress: null
    }, options, customOptions);
  }

  setupTemplates() {
    this.control = query('.wx-upload__control', this.$el);
    this.list = query('.wx-upload__list', this.$el);
    if(!this.list) {
      this.list = createElement('ul', {
        'class': 'wx-upload__list'
      });
      this.$el.appendChild(this.list);
    }
    addClass(this.$el, this._options.customClass);
    addClass(this.$el, 'wx-upload--' + this._options.listType);
    addClass(this.list, 'wx-upload__list--' + this._options.listType);
  }

  init() {
    proxy(this, this._options, 'fileList', this.render);
    this.fileList = this.fileList.slice(0);
    this.reqs = {};
    this.setupListeners();
  }

  setupListeners() {
    this.on(this.$field, 'change', e => {
      this._handleChangeEvent(e);
    });

    this.on(this.control, 'click', () => {
      this._handleClickEvent();
    });

    this.on(this.list, 'click', e => {
      const target = matchTarget(e.target, '[wx-action]', this.list);
      if(target) {
        const action = target.getAttribute('wx-action');
        if(action === 'remove') {
          const el = closest(target, '.wx-upload__list-item', this.list);
          const item = this.fileList.find(item => item.$el === el);
          if(item) {
            this.handleRemove(item.state);
          }
        }
        isFunction(this._options.onClick) && this._options.onClick(action);
      }
    });
  }

  _initFileItem(item) {
    let res;
    
    if(item.$el) {
      res = item;
    } else {
      const renderItem = isFunction(this._options.renderItem) 
        ? this._options.renderItem 
        : defaultRenderItem;
      item.status = item.status || 'success';
      item.uid = item.uid || guid();
      res = {
        $el: createElement('li', {
          'class': 'wx-upload__list-item',
          'domProps': {
            'innerHTML': renderItem.call(this, item, this)
          }
        }),
        _mounted: true,
        uid: item.uid,
        state: item
      };
      this.list.appendChild(res.$el);
    }
    return res;
  }

  _updateFileItem(item) {
    const { $el, state } = item;
    const newClass = 'is-' + state.status;
    const oldClass = ['ready', 'uploading', 'success', 'fail'].filter(d => d !== state.status).map(d => 'is-' + d).join(' ');
    removeClass($el, oldClass);
    addClass($el, newClass);

    if(state.status === 'uploading') {
      if(!item.$progress) {
        item.$progress = createElement('div', {
          'class': 'wx-upload__progress'
        });
        const renderProgress = isFunction(this._options.renderProgress)
          ? this._options.renderProgress
          : defaultRenderProgress;
        item.$progress.innerHTML = renderProgress.call(this, state, this);
        item.$el.appendChild(item.$progress);
      }
      const elms = queryAll('[wx-bind]', item.$progress);
      elms.forEach(el => {
        const val = el.getAttribute('wx-bind');
        if(val === 'text') {
          el.textContent = Number(state.percentage.toFixed(2)) + '%';
        } else if(val === 'width') {
          el.style.width = state.percentage + '%';
        }
      });
    } else if(state.status === 'success') {
      if(item.$progress) {
        setTimeout(() => {
          item.$progress && removeNode(item.$progress);
        }, 1500);
      }
    }

    return item;
  }

  render(target, source, key, newVal) {
    source[key] = (newVal || []).map(item => {
      item = target._initFileItem(item);
      item = target._updateFileItem(item);
      return item;
    });

    target.list.childNodes.forEach(node => {
      if(node.nodeType === 1) {
        const item = target.fileList.find(item => item.$el === node);
        if(!item) {
          removeNode(node);
        }
      }
    });
  }

  _revokeObjectURL(file) {
    if(file.url && file.url.indexOf('blob:') === 0) {
      try {
        URL.revokeObjectURL(file.url);
        file.url = '';
      } catch(err) {}
    }
  }

  _handleChangeEvent(e) {
    const files = e.target.files;
    files && this._uploadFiles([].slice.call(files));
  }

  _handleClickEvent() {
    if(!this._options.disabled) {
      this.$field.value = null;
      this.$field.click();
    }
  }

  _uploadFiles(files) {
    const { limit, onExceed, multiple, autoUpload } = this._options;

    if(limit && this.fileList.length + files.length > limit) {
      return isFunction(onExceed) && onExceed(files, this.fileList.map(item => item.state));
    }

    if(!multiple) {
      files = files.slice(0, 1);
    }

    files.forEach(rawFile => {
      this._handleStart(rawFile);
      autoUpload && this.upload(rawFile);
    });
  }

  _handleStart(rawFile) {
    rawFile.uid = guid();

    const file = {
      name: rawFile.name,
      size: rawFile.size,
      status: 'ready',
      uid: rawFile.uid,
      type: rawFile.type,
      raw: rawFile
    };

    try {
      file.url = URL.createObjectURL(rawFile);
    } catch(err) {
      throw new Error(err);
    }

    this.fileList = this.fileList.concat(file);
    this.handleChange(file);
  }

  upload(rawFile) {
    this.$field.value = null;

    if(!isFunction(this._options.beforeUpload)) {
      return this.post(rawFile);
    }

    const before = this._options.beforeUpload(rawFile);

    if(before && before.then) {
      before.then(processedFile => {
        const fileType = Object.prototype.toString.call(processedFile);

        if(fileType === '[object File]' || fileType === '[object Blob]') {
          if(fileType === '[object Blob]') {
            processedFile = new File([ processedFile ], rawFile.name, {
              type: rawFile.type
            });
          }

          Object.keys(rawFile).forEach(k => {
            processedFile[k] = rawFile[k];
          });

          this.post(processedFile);
        } else {
          this.post(rawFile);
        }
      }, () => {
        this.handleRemove(null, rawFile);
      });
    } else if(before !== false) {
      this.post(rawFile);
    } else {
      this.handleRemove(null, rawFile);
    }
  }

  post(rawFile) {
    const { uid } = rawFile;
    const { 
      name,
      url,
      data,
      headers,
      withCredentials,
      onProgress,
      onSuccess,
      onError,
      httpRequest
    } = this._options;
    const handleProgress = evt => {
      if(evt.total > 0) {
        evt.percent = evt.loaded / evt.total * 100;
      }
      const file = this.getFile(rawFile);
      file.status = 'uploading';
      file.percentage = evt.percent || 0;
      isFunction(onProgress) && onProgress(evt, file, this.fileList.map(item => item.state));
      this.handleChange(file, false);
    };
    const handleSuccess = res => {
      const file = this.getFile(rawFile);
      file.status = 'success';
      file.response = res;
      isFunction(onSuccess) && onSuccess(res, file, this.fileList.map(item => item.state));
      delete this.reqs[uid];
      this.handleChange(file);
    };
    const handleError = err => {
      const file = this.getFile(rawFile);
      delete this.reqs[uid];
      if(!file) return;
      file.status = 'fail';
      this.fileList = this.fileList.filter(item => item.uid !== uid);
      this._revokeObjectURL(file);
      isFunction(onError) && onError(err, file, this.fileList.map(item => item.state));
      this.handleChange(file);
    };
    const ajaxOption = {
      url: url,
      name: name,
      file: rawFile,
      data: data,
      headers: headers,
      withCredentials: withCredentials,
      onProgress: handleProgress,
      onSuccess: handleSuccess,
      onError: handleError
    };
    const req = httpRequest(ajaxOption);

    this.reqs[uid] = req;

    if(req && req.then) {
      req.then(handleSuccess, handleError);
    }
  }

  abort(file) {
    const reqs = this.reqs;

    if(file) {
      if(file.uid) {
        reqs[file.uid].abort();
        delete reqs[file.uid];
      }
    } else {
      Object.keys(reqs).forEach(uid => {
        reqs[uid].abort();
        delete reqs[uid];
      });
    }
  }

  handleChange(file, triggerChangeEvent) {
    this.fileList = this.fileList.slice(0);
    if(triggerChangeEvent !== false && isFunction(this._options.onChange)) {
      this._options.onChange(file, this.fileList.map(item => item.state));
    }
  }

  handleRemove(file, rawFile) {
    file = file || this.getFile(rawFile);
    this._revokeObjectURL(file);
    this.fileList = this.fileList.filter(item => item.uid !== file.uid);

    isFunction(this._options.onRemove) && this._options.onRemove(file, this.fileList);
  }

  getFile(rawFile) {
    const item = this.fileList.find(item => item.uid === rawFile.uid);

    return item ? item['state'] : null;
  }

  getSize(file, unit = 'KB') {
    const getUnitSize = {
      B(size) {
        return size;
      },
      KB(size) {
        return size / 1024;
      },
      MB(size) {
        return size / 1024 / 1024;
      },
      GB(size) {
        return size / 1024 / 1024 / 1024;
      }
    };
    let size;

    if(file.size) {
      size = getUnitSize[unit] && getUnitSize[unit](file.size);
    }

    return size;
  }

  on(el, type, fn) {
    (this._handlers || (this._handlers = [])).push({ el, type, fn });
    on(el, type, fn);
  }

  off() {
    if(this._handlers) {
      this._handlers.forEach(({ el, type, fn }) => {
        off(el, type, fn);
      });
      this._handlers = null;
    }
  }
}

function proxy(target, source, key, cb) {
  Object.defineProperty(target, key, {
    get() {
      return source[key];
    },
    set(newVal) {
      cb && cb(target, source, key, newVal);
    }
  });
}

function defaultRenderItem(data, ctx) {
  return `
    <div class="wx-upload__list-item-thumbnail" style="background-image: url('${ data.url }')"></div>
    <div class="wx-upload__list-item-content">
      <a class="wx-upload__list-item-name">${ data.name }</a>
    </div>
    <label class="wx-upload__list-item-status">
      <i class="wx-upload__list-item-success"></i>
    </label>
    <i class="wx-close wx-upload__list-item-remove" wx-action="remove"></i>
  `;
}

function defaultRenderProgress(data, ctx) {
  return `
    <div class="wx-progress wx-progress--inline">
      <div class="wx-progress-bar">
        <div class="wx-progress-bar__outer">
          <div class="wx-progress-bar__inner" wx-bind="width"></div>
        </div>
      </div>
      <div class="wx-progress-text" wx-bind="text"></div>
    </div>
  `;
}