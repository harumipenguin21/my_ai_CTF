const ADMIN_ID = "admin";
const ADMIN_PASSWORD = "J-Flag{admin_PW}";
const PRICE_FLAG = "J-Flag{price_tampering}";
const AVAILABILITY_FLAG = "J-Flag{availability_denied}";
const INITIAL_PRODUCT = {
  price: 5000,
  stock: 100
};
const productStorageVersion = 2;

const productKey = "juntendoCampusShopProduct";
const accessRuleKey = "juntendoCampusShopAccessRule-groupA";
const loginKey = "juntendoCampusShopAdminLoggedIn";

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupHintToggles();

  const page = document.body.dataset.page;
  if (page === "login") setupLoginPage();
  if (page === "admin") setupAdminPage();
  if (page === "shop") setupShopPage();
  if (page === "home") setupFlagForm();
  if (page === "problem3") setupProblem3Page();
});

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function setupHintToggles() {
  document.querySelectorAll(".hint-toggle[data-hint-target]").forEach((button) => {
    const target = document.getElementById(button.dataset.hintTarget);
    if (!target) return;

    button.addEventListener("click", () => {
      const willOpen = target.hidden;
      target.hidden = !willOpen;
      button.setAttribute("aria-expanded", String(willOpen));
      button.textContent = willOpen ? "ヒントを閉じる" : "ヒントを見る";
    });
  });
}

function getDefaultProductState() {
  return { ...INITIAL_PRODUCT, version: productStorageVersion };
}

function normalizeProductState(parsed) {
  if (!parsed || parsed.version !== productStorageVersion) return null;

  const price = Number(parsed.price);
  const stock = Number(parsed.stock);
  if (!Number.isInteger(price) || price < 0) return null;
  if (!Number.isInteger(stock) || stock < 0) return null;

  return { price, stock, version: productStorageVersion };
}

function getProductState() {
  const stored = localStorage.getItem(productKey);
  if (!stored) {
    const defaultState = getDefaultProductState();
    saveProductState(defaultState);
    return defaultState;
  }

  try {
    const parsed = JSON.parse(stored);
    const normalized = normalizeProductState(parsed);
    if (normalized) return normalized;
  } catch {
  }

  const defaultState = getDefaultProductState();
  saveProductState(defaultState);
  return defaultState;
}

function saveProductState(state) {
  localStorage.setItem(productKey, JSON.stringify({
    price: state.price,
    stock: state.stock,
    version: productStorageVersion
  }));
}

function resetProductState() {
  localStorage.removeItem(productKey);
}

function isShopAccessDenied() {
  return localStorage.getItem(accessRuleKey) === "deny-all";
}

function denyShopAccess() {
  localStorage.setItem(accessRuleKey, "deny-all");
}

function resetShopAccess() {
  localStorage.removeItem(accessRuleKey);
}

function setupLoginPage() {
  const form = document.querySelector("#login-form");
  const message = document.querySelector("#login-message");
  if (!form || !message) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = document.querySelector("#login-id").value.trim();
    const password = document.querySelector("#login-password").value.trim();

    if (id === ADMIN_ID && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(loginKey, "true");
      message.textContent = "ログイン成功。管理者ページへ移動します。";
      message.className = "message success";
      window.location.href = "groupA-admin.html";
      return;
    }

    message.textContent = "IDまたはパスワードが違います";
    message.className = "message error";
  });
}

function requireAdminLogin() {
  const loggedIn = sessionStorage.getItem(loginKey) === "true";
  if (!loggedIn) {
    window.location.replace("groupA-login.html");
    return false;
  }
  return true;
}

function setupAdminPage() {
  if (!requireAdminLogin()) return;

  const status = document.querySelector("#admin-login-status");
  if (status) {
    status.textContent = "管理者としてログイン中。問題1のフラグ：" + ADMIN_PASSWORD;
    status.className = "message success";
  }

  renderAdminProduct();
  setupProblem3Entry();
  setupPriceForm();
  setupResetButton();
  setupLogoutButton();
}

function renderAdminProduct() {
  const product = getProductState();
  const price = document.querySelector("#admin-current-price");
  const stock = document.querySelector("#admin-current-stock");
  const priceInput = document.querySelector("#new-price");
  const soldout = document.querySelector("#admin-soldout");

  if (price) price.textContent = String(product.price);
  if (stock) stock.textContent = String(product.stock);
  if (priceInput) priceInput.value = String(product.price);
  if (soldout) soldout.classList.toggle("hidden", product.stock !== 0);
}

function setupProblem3Entry() {
  const entry = document.querySelector("#challenge3-entry");
  if (!entry) return;
  entry.classList.toggle("hidden", getProductState().price !== 0);
}

function setupPriceForm() {
  const form = document.querySelector("#price-form");
  const input = document.querySelector("#new-price");
  const message = document.querySelector("#price-message");
  if (!form || !input || !message) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextPrice = Number(input.value);

    if (!Number.isInteger(nextPrice) || nextPrice < 0) {
      message.textContent = "0以上の整数を入力してください。";
      message.className = "message error";
      return;
    }

    const product = getProductState();
    product.price = nextPrice;
    saveProductState(product);
    renderAdminProduct();
    setupProblem3Entry();

    if (nextPrice === 0) {
      message.textContent = "価格を0円に更新しました。フラグ：" + PRICE_FLAG;
      message.className = "message success";
    } else {
      message.textContent = "価格を" + nextPrice + "円に更新しました。";
      message.className = "message success";
    }
  });
}

function setupResetButton() {
  const button = document.querySelector("#reset-button");
  if (!button) return;

  button.addEventListener("click", () => {
    resetProductState();
    resetShopAccess();
    renderAdminProduct();
    setupProblem3Entry();

    const priceMessage = document.querySelector("#price-message");
    if (priceMessage) priceMessage.textContent = "";
  });
}

function setupLogoutButton() {
  const button = document.querySelector("#logout-button");
  if (!button) return;

  button.addEventListener("click", () => {
    sessionStorage.removeItem(loginKey);
    window.location.href = "groupA-login.html";
  });
}

function setupProblem3Page() {
  if (!requireAdminLogin()) return;

  const openButton = document.querySelector("#open-terminal-button");
  const terminal = document.querySelector("#terminal-panel");
  const form = document.querySelector("#terminal-form");
  const input = document.querySelector("#terminal-command");
  const output = document.querySelector("#terminal-output");
  if (openButton && terminal) {
    openButton.addEventListener("click", () => {
      terminal.classList.remove("hidden");
      if (input) input.focus();
    });
  }

  if (!form || !input || !output) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const command = input.value.trim().toLowerCase();
    if (command === "deny all") {
      denyShopAccess();
      output.textContent = "Access rule updated.\nAll access to the shop page has been denied.";
      output.className = "terminal-output success";
      return;
    }
    output.textContent = "Command not recognized.";
    output.className = "terminal-output error";
  });
}

function setupShopResetButton() {
  const resetButton = document.getElementById("reset-shop-state");
  if (!resetButton) return;

  resetButton.addEventListener("click", () => {
    localStorage.removeItem(productKey);
    localStorage.removeItem(accessRuleKey);
    window.location.reload();
  });
}

function setupShopPage() {
  setupShopResetButton();
  const productGrid = document.querySelector("#product-grid");
  const forbidden = document.querySelector("#forbidden-panel");

  if (isShopAccessDenied()) {
    if (productGrid) productGrid.classList.add("hidden");
    if (forbidden) forbidden.classList.remove("hidden");
    return;
  }

  if (productGrid) productGrid.classList.remove("hidden");
  if (forbidden) forbidden.classList.add("hidden");

  const product = getProductState();
  const price = document.querySelector("#shop-price");
  const lowStock = document.querySelector("#shop-low-stock");
  const soldout = document.querySelector("#shop-soldout");
  const buyButton = document.querySelector("#buy-button");

  if (price) price.textContent = String(product.price);

  const isSoldOut = product.stock === 0;
  const isLowStock = product.stock >= 1 && product.stock <= 10;
  if (lowStock) lowStock.classList.toggle("hidden", !isLowStock);
  if (soldout) soldout.classList.toggle("hidden", !isSoldOut);
  if (buyButton) {
    buyButton.disabled = isSoldOut;
    buyButton.textContent = isSoldOut ? "購入できません" : "購入する";
    buyButton.classList.toggle("secondary", isSoldOut);
    buyButton.classList.toggle("primary", !isSoldOut);
  }
}

function setupFlagForm() {
  const form = document.querySelector("#flag-form");
  const result = document.querySelector("#flag-result");
  if (!form || !result) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const answers = [
      document.querySelector("#flag1").value.trim(),
      document.querySelector("#flag2").value.trim(),
      document.querySelector("#flag3").value.trim()
    ];

    const expected = [ADMIN_PASSWORD, PRICE_FLAG, AVAILABILITY_FLAG];
    const solved = answers.filter((answer, index) => answer === expected[index]).length;

    if (solved === expected.length) {
      result.textContent = "3問すべて正解です。CIAの3要素を確認できました。";
      result.className = "message success";
      return;
    }

    result.textContent = solved + " / " + expected.length + " 問正解です。入力内容をもう一度確認してください。";
    result.className = solved > 0 ? "message warning" : "message error";
  });
}