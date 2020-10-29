(function () {
  // ボタンと本体
  const openButton = document.querySelector(".js-openDrawer");
  const drawer = document.querySelector(".js-drawer");
  const closeButton = drawer.querySelector(".js-closeDrawer");
  const backdrop = drawer.querySelector(".js-backdrop");

  const rootElement = document.documentElement;
  const scrollLockModifier = "drawerOpen";

  const scrollbarFixTargets = document.querySelectorAll(".js-scrollbarFix");
  let scrollbarFix = false;

  const scrollableTarget = drawer.querySelector(".js-scrollable");

  const anchorLinks = drawer.querySelectorAll('.Nav-link');

  let touchY = null;

  // 現在の状態（開いていたらtrue）
  let drawerOpen = false;

  // 閉じたあとに開くボタンにフォーカスを戻すか
  let focusOpenButtonAfterClose = true;

  const tabbableElements = drawer.querySelectorAll("a[href], button:not(:disabled)");
  // ドロワー内の Tab キーでフォーカス可能な最初の要素
  const firstTabbable = tabbableElements[0];
  // ドロワー内の Tab キーでフォーカス可能な最後の要素
  const lastTabbable = tabbableElements[tabbableElements.length - 1]

  // stateは真偽値
  function changeAriaExpanded(state) {
    const value = state ? "true" : "false";
    drawer.setAttribute("aria-expanded", value);
    openButton.setAttribute("aria-expanded", value);
    closeButton.setAttribute("aria-expanded", value);
  }

  // stateは真偽値
  function changeState(state) {
    if (state === drawerOpen) {
      console.log("2回以上連続で同じ状態に変更しようとしました");
      return;
    }
    changeAriaExpanded(state);
    drawerOpen = state;
  }

  function openDrawer() {
    // ドロワーを開くときにフォーカスを戻す設定にリセット
    focusOpenButtonAfterClose = true;
    changeState(true);
  }

  function closeDrawer() {
    changeState(false);
  }

  function onClickOpenButton() {
    // アニメーション開始時にスクロール位置を固定
    activateScrollLock();
    openDrawer();
    firstTabbable.focus();
  }

  function onClickCloseButton() {
    closeDrawer();
  }

  function activateScrollLock() {
    addScrollbarWidth();
    rootElement.classList.add(scrollLockModifier);
  }

  function deactivateScrollLock() {
    removeScrollbarWidth();
    rootElement.classList.remove(scrollLockModifier);
  }

  /**
  * ナビを開いているときにメインコンテンツがスクロールされないようにする対策
  * ナビを開いているときにはメインコンテンツのスクロール位置を固定し、閉じたら元に戻す、という処理を行う
  */

  function onTransitionendDrawer(event) {
    // transitionend イベントはプロパティごとにも発生するため、対象とするプロパティのトランジション終了であるかどうかを判定
    // 状態が遷移するドロワー本体のプロパティは visibility のみ
    if (event.target !== drawer || event.propertyName !== "visibility") {
      return;
    }
    if (!drawerOpen) {
      // アニメーション終了時にスクロール位置を固定
      // 閉じるボタンのクリックイベントに結び付けることができないため、トランジション（遷移アニメーション）終了時の transitionend イベントにイベントハンドラを追加
      deactivateScrollLock();
      // 開くボタンにフォーカスを戻す設定の場合のみ、フォーカスを戻す
      if (focusOpenButtonAfterClose) {
        openButton.focus();
      }
    }
  }

  // valueは文字列
  function addScrollbarMargin(value) {
    const targetsLength = scrollbarFixTargets.length;
    for (let i = 0; i < targetsLength; i++) {
      scrollbarFixTargets[i].style.marginRight = value;
    }
  }

  function addScrollbarWidth() {
    // スクロールバーの幅（ブラウザの表示領域からhtmlの幅を引いた数値）
    // `html { overflow:auto }` の場合、ブラウザがリサイズされたときは再度取得し直す必要がある
    const scrollbarWidth = window.innerWidth - rootElement.clientWidth;
    // スクロールバーの幅を取得するとき、その値が 0 なら margin-right を追加しないようにする
    if (!scrollbarWidth) {
      scrollbarFix = false;
      return;
    }
    const value = scrollbarWidth + "px";
    addScrollbarMargin(value);
    scrollbarFix = true;
  }

  function removeScrollbarWidth() {
    if (!scrollbarFix) {
      return;
    }
    addScrollbarMargin("");
  }

  /**
   * iOS Safari の対策
   * iOS Safariでは `html { overflow:hidden }` であってもスクロールできてしまう
   */

  function onTouchStart(event) {
    // タッチのポイントが複数かどうかを判定
    // この処理によってピンチイン/アウトなどマルチタッチ動作を妨げることがなくなる
    if (event.targetTouches.length > 1) {
      return;
    }
    touchY = event.targetTouches[0].clientY;
  }

  function onTouchMove(event) {
    if (event.targetTouches.length > 1) {
      return;
    }
    // touchstart時と現在の差分から、スクロール方向を得る
    // 正：上方向へスクロール
    // 負：下方向へスクロール
    const touchMoveDiff = event.targetTouches[0].clientY - touchY;

    // スクロールさせたい対象のスクロール位置が一番上の場合、上方向のスクロールをキャンセルする
    if (scrollableTarget.scrollTop === 0 && touchMoveDiff > 0) {
      event.preventDefault();
      return;
    }

    // スクロールさせたい対象のスクロール位置が一番下の場合、下方向へのスクロールをキャンセルする
    if (targetTotallyScrolled(scrollableTarget) && touchMoveDiff < 0) {
      event.preventDefault();
    }
  }

  // ターゲット要素がすべてスクロールし終わっているかどうかを判定
  function targetTotallyScrolled(element) {
    return element.scrollHeight - element.scrollTop <= element.clientHeight;
  }

  // オーバーレイ部分は常にスクロール動作をキャンセルする
  function onTouchMoveBackdrop(event) {
    if (event.targetTouches.length > 1) {
      return;
    }
    event.preventDefault();
  }

  /**
   * フォーカスがドロワー内から外側へ出ることなく、ドロワー内部を循環するようにフォーカス制御する
   */

  function onKeydownTabKeyFirstTabbable(event) {
    // Shift キーが押されていなければブラウザ標準のフォーカス制御
    if(event.key !== "Tab" || !event.shiftKey) {
      return;
    }
    // ブラウザ標準のフォーカス制御無効
    event.preventDefault();
    lastTabbable.focus();
  }

  function onKeydownTabKeyLastTabbable(event) {
    // Shift キーが押されていればブラウザ標準のフォーカス制御
    if(event.key !== "Tab" || event.shiftKey) {
      return;
    }
    event.preventDefault();
    firstTabbable.focus();
  }

  /**
   * Escape キーでドロワーを閉じる
   */

  function onKeydownEsc(event) {
    if(!drawerOpen || event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    closeDrawer();
  }

  /**
   * ナビリンククリックでドロワーを閉じる
   */
  function onClickAnchorLink(event) {
    // アンカーリンクをクリックしたら開くボタンにフォーカスを戻す設定を false にする
    focusOpenButtonAfterClose = false;
    closeDrawer();
  }

  openButton.addEventListener("click", onClickOpenButton, false);
  closeButton.addEventListener("click", onClickCloseButton, false);
  backdrop.addEventListener("click", onClickCloseButton, false);
  drawer.addEventListener("transitionend", onTransitionendDrawer, false);

  scrollableTarget.addEventListener("touchstart", onTouchStart, false);
  scrollableTarget.addEventListener("touchmove", onTouchMove, false);
  backdrop.addEventListener("touchmove", onTouchMoveBackdrop, false);

  firstTabbable.addEventListener("keydown", onKeydownTabKeyFirstTabbable, false);
  lastTabbable.addEventListener("keydown", onKeydownTabKeyLastTabbable, false);

  window.addEventListener("keydown", onKeydownEsc, false);

  for (let i = 0, len = anchorLinks.length; i < len; i++) {
    anchorLinks[i].addEventListener('click', onClickAnchorLink, false);
  }
})();