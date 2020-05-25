
function getError(url, xhr) {
  let msg;

  if(xhr.response) {
    msg = `${ xhr.response.error || xhr.response }`;
  } else if(xhr.responseText) {
    msg = `${ xhr.responseText }`;
  } else {
    msg = `fail to post ${ url } ${ xhr.status }`;
  }

  const err = new Error(msg);
  err.status = xhr.status;
  err.method = 'post';
  err.url = url;

  return err;
}

function getBody(xhr) {
  let text = xhr.responseText || xhr.response;

  if(!text) return text;

  try {
    return JSON.parse(text);
  } catch(err) {
    return text;
  }
}

export function uploadAjax(options) {
  if(typeof XMLHttpRequest === 'undefined') return;

  const xhr = new XMLHttpRequest();
  const url = options.url;

  if(xhr.upload && options.onProgress) {
    xhr.upload.onprogress = options.onProgress;
  }

  const formData = new FormData();

  if(options.data) {
    Object.keys(options.data).forEach(k => {
      formData.append(k, options.data[k]);
    });
  }

  formData.append(options.name, options.file, options.file.name);

  if(options.onError) {
    xhr.onerror = options.onError;
  }

  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4) {
      if(xhr.status >= 200 && xhr.status < 300) {
        options.onSuccess && options.onSuccess(getBody(xhr));
      } else {
        options.onError && options.onError(getError(url, xhr));
      }
    }
  };

  xhr.open('POST', url, true);

  if(options.withCredentials && 'withCredentials' in xhr) {
    xhr.withCredentials = true;
  }

  if(options.headers) {
    Object.keys(options.headers).forEach(k => {
      xhr.setRequestHeader(k, options.headers[k]);
    });
  }

  xhr.send(formData);

  return xhr;
}