function getBase() {
  return getMode() === 'production' ? '/rhythm' : '';
}
function getMode() {
  return window.__VUE_HMR_RUNTIME__ ? 'development' : 'production';
}
  
export { getBase, getMode };