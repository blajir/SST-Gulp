// module.exportを使ってhello関数を定義する。
module.exports.hello = function () {
  setTimeout(() => {
    alert("helloメソッドが実行された。");
  }, 3000);
}
