import { Key } from './classes.js';

function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  }
}

const clamp = (val, min, max) => Math.max(Math.min(val, max), min);

const randomKey = _ => (Math.floor(Math.random() * 0xffffff)).toString(16);

const delay = time => new Promise(resolve => setTimeout(resolve, time));

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const allKeys = (() => {
  return [new Key('A', 0), new Key('A#', 0), new Key('B', 0),
    ...[...Array(7)].map((_, i) => 
      noteNames.map(e => new Key(e,i+1))
  ).flat(), new Key('C', 8)].reverse();
})();

const formatNumber = val => Math.floor(val*10)/10;

function matchParent(element, selector) {
  if (element === document) return false;
  if (element.matches(selector)) return true;
  return element.parentNode && matchParent(element.parentNode, selector);
}

function NOOP() {};

export { throttle, clamp, randomKey, delay, noteNames, allKeys, formatNumber, matchParent, NOOP };

// Language: javascript
// Given a video file as a blob, a width and a height, return a new blob of the video cropped to that width and height
function cropVideo(filename, width, height) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const blob = new Blob([fileReader.result], { type: 'video/mp4' });
      const video = document.createElement('video');
      video.src = URL.createObjectURL(blob);
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);
        const croppedBlob = new Blob([canvas.toDataURL('image/jpeg')], { type: 'image/jpeg' });
        resolve(croppedBlob);
      }
    }
    fileReader.readAsArrayBuffer(filename);
  }).catch(err => console.log(err));
}