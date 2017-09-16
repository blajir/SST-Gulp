// module.exportを使ってhello関数を定義する。
module.exports.hello = () => {
  // setTimeout(() => {
  //   alert("helloメソッドが実行された。");
  // }, 3000);
  var hoge = document.getElementById('hoge');

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 100) {
      hoge.style.backgroundColor = 'red';
    } else {
      hoge.style.backgroundColor = 'transparent';
    }
  });
}
