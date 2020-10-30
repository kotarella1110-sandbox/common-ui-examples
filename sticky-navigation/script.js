(function () {

  // スティッキーにする要素（ターゲット）
  const stickyTarget = document.querySelector(".js-sticky");
  const stickyTargetParent = document.querySelector(".js-stickyParent");
  const stickyTargetRect = stickyTarget.getBoundingClientRect();
  // ターゲット要素の本来の Y 座標（ページの左上基準）
  const stickyTargetPosY = getAbsolutePosY(stickyTargetRect);
  let isFixed = false;

  setHeight(stickyTargetParent, stickyTargetRect);

  // 現在のスクロール量（Y方向）を取得する
  function getScrollY() {
    // IE が `window.scrollY` をサポートしていないため、それが存在しない場合は `window.pageYOffset` を返す
    // 他のブラウザにおける `window.pageYOffset` は `window.scrollY` のエイリアスとなっている
    return window.scrollY || window.pageYOffset;
  }

  // ターゲット要素の本来の Y 座標を取得する
  function getAbsolutePosY(domRect) {
    const scrollY = getScrollY();
    // ビューポートからの位置を取得
    const offsetFromViewportTop = domRect.top;
    return scrollY + offsetFromViewportTop;
  }

  function setHeight(element, domRect) {
    element.style.height = domRect.height + "px";
  }

  function unfixed() {
    if (!isFixed) {
      return;
    }
    stickyTarget.classList.remove("fixed");
    isFixed = false;
  }

  function fixed() {
    if (isFixed) {
      return;
    }
    stickyTarget.classList.add("fixed");
    isFixed = true;
  }

  function onScroll(event) {
    const currentScrollY = getScrollY();
    if (currentScrollY < stickyTargetPosY) {
      unfixed();
    } else {
      fixed();
    }
  }

  window.addEventListener("scroll", onScroll, false);
})();