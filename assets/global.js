function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute("role", "button");
  summary.setAttribute(
    "aria-expanded",
    summary.parentNode.hasAttribute("open")
  );

  if (summary.nextElementSibling.getAttribute("id")) {
    summary.setAttribute("aria-controls", summary.nextElementSibling.id);
  }

  summary.addEventListener("click", (event) => {
    event.currentTarget.setAttribute(
      "aria-expanded",
      !event.currentTarget.closest("details").hasAttribute("open")
    );
  });

  if (summary.closest("header-drawer, menu-drawer")) return;
  summary.parentElement.addEventListener("keyup", onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (
    elementToFocus.tagName === "INPUT" &&
    ["search", "text", "email", "url"].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch (e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = [
    "ARROWUP",
    "ARROWDOWN",
    "ARROWLEFT",
    "ARROWRIGHT",
    "TAB",
    "ENTER",
    "SPACE",
    "ESCAPE",
    "HOME",
    "END",
    "PAGEUP",
    "PAGEDOWN",
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener("keydown", (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener("mousedown", (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    "focus",
    () => {
      if (currentFocusedElement)
        currentFocusedElement.classList.remove("focused");

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add("focused");
    },
    true
  );
}

function pauseAllMedia() {
  document.querySelectorAll(".js-youtube").forEach((video) => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
      "*"
    );
  });
  document.querySelectorAll(".js-vimeo").forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  document.querySelectorAll("video").forEach((video) => video.pause());
  document.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== "ESCAPE") return;

  const openDetailsElement = event.target.closest("details[open]");
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector("summary");
  openDetailsElement.removeAttribute("open");
  summaryElement.setAttribute("aria-expanded", false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });
    this.input.addEventListener("change", this.onInputChange.bind(this));
    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.quantityUpdate,
      this.validateQtyRules.bind(this)
    );
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle("disabled", value <= min);
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle("disabled", value >= max);
    }
  }
}

customElements.define("quantity-input", QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}

function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(
    options["hideElement"] || province_domid
  );

  Shopify.addListener(
    this.countryEl,
    "change",
    Shopify.bind(this.countryHandler, this)
  );

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    this.querySelectorAll("button:not(.localization-selector)").forEach(
      (button) =>
        button.addEventListener("click", this.onCloseButtonClick.bind(this))
    );
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(
          event,
          this.mainDetailsToggle.querySelector("summary")
        )
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest(".has-submenu");
    const isOpen = detailsElement.hasAttribute("open");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(
        summaryElement.nextElementSibling,
        detailsElement.querySelector("button")
      );
      summaryElement.nextElementSibling.removeEventListener(
        "transitionend",
        addTrapFocus
      );
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen
        ? this.closeMenuDrawer(event, summaryElement)
        : this.openMenuDrawer(summaryElement);

      if (window.matchMedia("(max-width: 990px)")) {
        document.documentElement.style.setProperty(
          "--viewport-height",
          `${window.innerHeight}px`
        );
      }
    } else {
      setTimeout(() => {
        detailsElement.classList.add("menu-opening");
        summaryElement.setAttribute("aria-expanded", true);
        parentMenuElement && parentMenuElement.classList.add("submenu-open");
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener(
              "transitionend",
              addTrapFocus
            );
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove("menu-opening");
    this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
      details.removeAttribute("open");
      details.classList.remove("menu-opening");
    });
    this.mainDetailsToggle
      .querySelectorAll(".submenu-open")
      .forEach((submenu) => {
        submenu.classList.remove("submenu-open");
      });
    document.body.classList.remove(
      `overflow-hidden-${this.dataset.breakpoint}`
    );
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);

    if (event instanceof KeyboardEvent)
      elementToFocus?.setAttribute("aria-expanded", false);
  }

  onFocusOut() {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute("open") &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest("details");
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest(".submenu-open");
    parentMenuElement && parentMenuElement.classList.remove("submenu-open");
    detailsElement.classList.remove("menu-opening");
    detailsElement
      .querySelector("summary")
      .setAttribute("aria-expanded", false);
    removeTrapFocus(detailsElement.querySelector("summary"));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute("open");
        if (detailsElement.closest("details[open]")) {
          trapFocus(
            detailsElement.closest("details[open]"),
            detailsElement.querySelector("summary")
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define("menu-drawer", MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector(".section-header");
    this.borderOffset =
      this.borderOffset ||
      this.closest(".header-wrapper").classList.contains(
        "header-wrapper--border-bottom"
      )
        ? 1
        : 0;
    document.documentElement.style.setProperty(
      "--header-bottom-position",
      `${parseInt(
        this.header.getBoundingClientRect().bottom - this.borderOffset
      )}px`
    );
    this.header.classList.add("menu-open");

    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });

    summaryElement.setAttribute("aria-expanded", true);
    window.addEventListener("resize", this.onResize);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    if (!elementToFocus) return;
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove("menu-open");
    window.removeEventListener("resize", this.onResize);
  }

  onResize = () => {
    this.header &&
      document.documentElement.style.setProperty(
        "--header-bottom-position",
        `${parseInt(
          this.header.getBoundingClientRect().bottom - this.borderOffset
        )}px`
      );
    document.documentElement.style.setProperty(
      "--viewport-height",
      `${window.innerHeight}px`
    );
  };
}

customElements.define("header-drawer", HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      "click",
      this.hide.bind(this, false)
    );
    this.addEventListener("keyup", (event) => {
      if (event.code.toUpperCase() === "ESCAPE") this.hide();
    });
    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", (event) => {
        if (
          event.pointerType === "mouse" &&
          !event.target.closest("deferred-media, product-model")
        )
          this.hide();
      });
    } else {
      this.addEventListener("click", (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector(".template-popup");
    document.body.classList.add("overflow-hidden");
    this.setAttribute("open", "");
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove("overflow-hidden");
    document.body.dispatchEvent(new CustomEvent("modalClosed"));
    this.removeAttribute("open");
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define("modal-dialog", ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector("button");

    if (!button) return;
    button.addEventListener("click", () => {
      const modal = document.querySelector(this.getAttribute("data-modal"));
      if (modal) modal.show(button);
    });
  }
}
customElements.define("modal-opener", ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(
        this.querySelector("template").content.firstElementChild.cloneNode(true)
      );

      this.setAttribute("loaded", true);
      const deferredElement = this.appendChild(
        content.querySelector("video, model-viewer, iframe")
      );
      if (focus) deferredElement.focus();
      if (
        deferredElement.nodeName == "VIDEO" &&
        deferredElement.getAttribute("autoplay")
      ) {
        // force autoplay for safari
        deferredElement.play();
      }
    }
  }
}

customElements.define("deferred-media", DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector(".slider-counter--current");
    this.pageTotalElement = this.querySelector(".slider-counter--total");
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener("scroll", this.update.bind(this));
    this.prevButton.addEventListener("click", this.onButtonClick.bind(this));
    this.nextButton.addEventListener("click", this.onButtonClick.bind(this));
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(
      (element) => element.clientWidth > 0
    );
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset =
      this.sliderItemsToShow[1].offsetLeft -
      this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor(
      (this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) /
        this.sliderItemOffset
    );
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    // Temporarily prevents unneeded updates resulting from variant changes
    // This should be refactored as part of https://github.com/Shopify/dawn/issues/2057
    if (!this.slider || !this.nextButton) return;

    const previousPage = this.currentPage;
    this.currentPage =
      Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent("slideChanged", {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );
    }

    if (this.enableSliderLooping) return;

    if (
      this.isSlideVisible(this.sliderItemsToShow[0]) &&
      this.slider.scrollLeft === 0
    ) {
      this.prevButton.setAttribute("disabled", "disabled");
    } else {
      this.prevButton.removeAttribute("disabled");
    }

    if (
      this.isSlideVisible(
        this.sliderItemsToShow[this.sliderItemsToShow.length - 1]
      )
    ) {
      this.nextButton.setAttribute("disabled", "disabled");
    } else {
      this.nextButton.removeAttribute("disabled");
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide =
      this.slider.clientWidth + this.slider.scrollLeft - offset;
    return (
      element.offsetLeft + element.clientWidth <= lastVisibleSlide &&
      element.offsetLeft >= this.slider.scrollLeft
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition =
      event.currentTarget.name === "next"
        ? this.slider.scrollLeft + step * this.sliderItemOffset
        : this.slider.scrollLeft - step * this.sliderItemOffset;
    this.setSlidePosition(this.slideScrollPosition);
  }

  setSlidePosition(position) {
    this.slider.scrollTo({
      left: position,
    });
  }
}

customElements.define("slider-component", SliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector(".slider-buttons");
    this.enableSliderLooping = true;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector(".slideshow__slide");
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.announcementBarSlider = this.querySelector(".announcement-bar-slider");
    // Value below should match --duration-announcement-bar CSS value
    this.announcerBarAnimationDelay = this.announcementBarSlider ? 250 : 0;

    this.sliderControlLinksArray = Array.from(
      this.sliderControlWrapper.querySelectorAll(".slider-counter__link")
    );
    this.sliderControlLinksArray.forEach((link) =>
      link.addEventListener("click", this.linkToSlide.bind(this))
    );
    this.slider.addEventListener("scroll", this.setSlideVisibility.bind(this));
    this.setSlideVisibility();

    if (this.announcementBarSlider) {
      this.announcementBarArrowButtonWasClicked = false;

      this.reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );
      this.reducedMotion.addEventListener("change", () => {
        if (this.slider.getAttribute("data-autoplay") === "true")
          this.setAutoPlay();
      });

      [this.prevButton, this.nextButton].forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            this.announcementBarArrowButtonWasClicked = true;
          },
          { once: true }
        );
      });
    }

    if (this.slider.getAttribute("data-autoplay") === "true")
      this.setAutoPlay();
  }

  setAutoPlay() {
    this.autoplaySpeed = this.slider.dataset.speed * 1000;
    this.addEventListener("mouseover", this.focusInHandling.bind(this));
    this.addEventListener("mouseleave", this.focusOutHandling.bind(this));
    this.addEventListener("focusin", this.focusInHandling.bind(this));
    this.addEventListener("focusout", this.focusOutHandling.bind(this));

    if (this.querySelector(".slideshow__autoplay")) {
      this.sliderAutoplayButton = this.querySelector(".slideshow__autoplay");
      this.sliderAutoplayButton.addEventListener(
        "click",
        this.autoPlayToggle.bind(this)
      );
      this.autoplayButtonIsSetToPlay = true;
      this.play();
    } else {
      this.reducedMotion.matches || this.announcementBarArrowButtonWasClicked
        ? this.pause()
        : this.play();
    }
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    this.wasClicked = true;

    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) {
      this.applyAnimationToAnnouncementBar(event.currentTarget.name);
      return;
    }

    if (isFirstSlide && event.currentTarget.name === "previous") {
      this.slideScrollPosition =
        this.slider.scrollLeft +
        this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === "next") {
      this.slideScrollPosition = 0;
    }

    this.setSlidePosition(this.slideScrollPosition);

    this.applyAnimationToAnnouncementBar(event.currentTarget.name);
  }

  setSlidePosition(position) {
    if (this.setPositionTimeout) clearTimeout(this.setPositionTimeout);
    this.setPositionTimeout = setTimeout(() => {
      this.slider.scrollTo({
        left: position,
      });
    }, this.announcerBarAnimationDelay);
  }

  update() {
    super.update();
    this.sliderControlButtons = this.querySelectorAll(".slider-counter__link");
    this.prevButton.removeAttribute("disabled");

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach((link) => {
      link.classList.remove("slider-counter__link--active");
      link.removeAttribute("aria-current");
    });
    this.sliderControlButtons[this.currentPage - 1].classList.add(
      "slider-counter__link--active"
    );
    this.sliderControlButtons[this.currentPage - 1].setAttribute(
      "aria-current",
      true
    );
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton ||
        this.sliderAutoplayButton.contains(event.target);
      if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
      this.play();
    } else if (
      !this.reducedMotion.matches &&
      !this.announcementBarArrowButtonWasClicked
    ) {
      this.play();
    }
  }

  focusInHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton ||
        this.sliderAutoplayButton.contains(event.target);
      if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
        this.play();
      } else if (this.autoplayButtonIsSetToPlay) {
        this.pause();
      }
    } else if (this.announcementBarSlider.contains(event.target)) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute("aria-live", "off");
    clearInterval(this.autoplay);
    this.autoplay = setInterval(
      this.autoRotateSlides.bind(this),
      this.autoplaySpeed
    );
  }

  pause() {
    this.slider.setAttribute("aria-live", "polite");
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add("slideshow__autoplay--paused");
      this.sliderAutoplayButton.setAttribute(
        "aria-label",
        window.accessibilityStrings.playSlideshow
      );
    } else {
      this.sliderAutoplayButton.classList.remove("slideshow__autoplay--paused");
      this.sliderAutoplayButton.setAttribute(
        "aria-label",
        window.accessibilityStrings.pauseSlideshow
      );
    }
  }

  autoRotateSlides() {
    const slideScrollPosition =
      this.currentPage === this.sliderItems.length
        ? 0
        : this.slider.scrollLeft + this.sliderItemOffset;

    this.setSlidePosition(slideScrollPosition);
    this.applyAnimationToAnnouncementBar();
  }

  setSlideVisibility(event) {
    this.sliderItemsToShow.forEach((item, index) => {
      const linkElements = item.querySelectorAll("a");
      if (index === this.currentPage - 1) {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.removeAttribute("tabindex");
          });
        item.setAttribute("aria-hidden", "false");
        item.removeAttribute("tabindex");
      } else {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.setAttribute("tabindex", "-1");
          });
        item.setAttribute("aria-hidden", "true");
        item.setAttribute("tabindex", "-1");
      }
    });
    this.wasClicked = false;
  }

  applyAnimationToAnnouncementBar(button = "next") {
    if (!this.announcementBarSlider) return;

    const itemsCount = this.sliderItems.length;
    const increment = button === "next" ? 1 : -1;

    const currentIndex = this.currentPage - 1;
    let nextIndex = (currentIndex + increment) % itemsCount;
    nextIndex = nextIndex === -1 ? itemsCount - 1 : nextIndex;

    const nextSlide = this.sliderItems[nextIndex];
    const currentSlide = this.sliderItems[currentIndex];

    const animationClassIn = "announcement-bar-slider--fade-in";
    const animationClassOut = "announcement-bar-slider--fade-out";

    const isFirstSlide = currentIndex === 0;
    const isLastSlide = currentIndex === itemsCount - 1;

    const shouldMoveNext =
      (button === "next" && !isLastSlide) ||
      (button === "previous" && isFirstSlide);
    const direction = shouldMoveNext ? "next" : "previous";

    currentSlide.classList.add(`${animationClassOut}-${direction}`);
    nextSlide.classList.add(`${animationClassIn}-${direction}`);

    setTimeout(() => {
      currentSlide.classList.remove(`${animationClassOut}-${direction}`);
      nextSlide.classList.remove(`${animationClassIn}-${direction}`);
    }, this.announcerBarAnimationDelay * 2);
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition =
      this.slider.scrollLeft +
      this.sliderFirstItemNode.clientWidth *
        (this.sliderControlLinksArray.indexOf(event.currentTarget) +
          1 -
          this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }
}

customElements.define("slideshow-component", SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    // this.addEventListener('change', this.onVariantChange);

    // toggle variant option
    this.addEventListener("click", this.onVariantChange);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, "", false);
    this.updatePickupAvailability();
    this.removeErrorMessage();
    this.updateVariantStatuses();

    if (!this.currentVariant) {
      this.toggleAddButton(true, "", true);
      // this.setUnavailable();
    } else {
      this.updateMedia();
      // this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
    }
  }

  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll("select"),
      (select) => select.value
    );
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    // const mediaGalleries = document.querySelectorAll(`[id^="MediaGallery-${this.dataset.section}"]`);
    // mediaGalleries.forEach((mediaGallery) =>
    //   mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`)
    // );

    const modalContent = document.querySelector(
      `#ProductModal-${this.dataset.section} .product-media-modal__content`
    );
    if (!modalContent) return;
    const newMediaModal = modalContent.querySelector(
      `[data-media-id="${this.currentVariant.featured_media.id}"]`
    );
    modalContent.prepend(newMediaModal);
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === "false") return;
    window.history.replaceState(
      {},
      "",
      `${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateShareUrl() {
    const shareButton = document.getElementById(
      `Share-${this.dataset.section}`
    );
    if (!shareButton || !shareButton.updateUrl) return;
    shareButton.updateUrl(
      `${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  updateVariantStatuses() {
    let availableVariantsData = [];
    let selectedOptions = [null, null, null];
    for (let i = 0; i < this.variantData.length; i++) {
      if (!this.variantData[i].available) continue;
      let variantOptions = [
        this.variantData[i].option1,
        this.variantData[i].option2,
        this.variantData[i].option3,
      ];
      availableVariantsData.push(variantOptions);
    }
    let variantRadioSelectors = this.querySelectorAll(".product-form__input");
    for (let i = 0; i < variantRadioSelectors.length; i++) {
      // if(variantRadioSelectors[i].querySelector(':checked')){
      //   selectedOptions[i] = variantRadioSelectors[i].querySelector(':checked').value;

      // check conditon behalf on checked + have selected class
      if (variantRadioSelectors[i].querySelector(":checked.selected")) {
        selectedOptions[i] =
          variantRadioSelectors[i].querySelector(":checked.selected").value;
      } else {
        selectedOptions[i] = null;
      }
    }
    const inputWrappers = [...this.querySelectorAll(".product-form__input")];
    inputWrappers.forEach((option, index) => {
      const optionInputs = [
        ...option.querySelectorAll('input[type="radio"], option'),
      ];

      optionInputs.forEach((input) => {
        let optionAvailable = false;
        let tempArray = selectedOptions.slice(0);
        tempArray[index] = input.getAttribute("value");
        for (let i = 0; i < availableVariantsData.length; i++) {
          let tempAvailableVariantArray = availableVariantsData[i].slice(0);
          for (let j = 0; j < tempArray.length; j++) {
            if (tempArray[j] == null) {
              tempAvailableVariantArray[j] = null;
            }
          }
          if (
            JSON.stringify(tempArray) ==
            JSON.stringify(tempAvailableVariantArray)
          ) {
            optionAvailable = true;
          }
        }
        if (optionAvailable) {
          input.classList.remove("disabled");
        } else {
          input.classList.add("disabled");
        }
        // check unselected variant length of swatches toggle if length is 0 then remove disabled class on all variants
        var selectedVariant_length = $(
          ".main-product variant-radios input.selected"
        ).length;
        if (selectedVariant_length <= 0) {
          $(".main-product variant-radios input").removeClass("disabled");
        }

        var option_labels = input.nextElementSibling;
        if (option_labels != null && option_labels.classList.contains('shake-me')){
          option_labels.classList.remove('shake-me');
        }
      });
    });
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute("value"))) {
        input.innerText = input.getAttribute("value");
      } else {
        input.innerText = window.variantStrings.unavailable_with_option.replace(
          "[value]",
          input.getAttribute("value")
        );
      }
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector("pickup-availability");
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute("available");
      pickUpAvailability.innerHTML = "";
    }
  }

  removeErrorMessage() {
    const section = this.closest("section");
    if (!section) return;

    const productForm = section.querySelector("product-form");
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection
      ? this.dataset.originalSection
      : this.dataset.section;

    fetch(
      `${this.dataset.url}?variant=${requestedVariantId}&section_id=${
        this.dataset.originalSection
          ? this.dataset.originalSection
          : this.dataset.section
      }`
    )
      .then((response) => response.text())
      .then((responseText) => {
        // prevent unnecessary ui changes from abandoned selections
        if (this.currentVariant.id !== requestedVariantId) return;

        const html = new DOMParser().parseFromString(responseText, "text/html");
        const destination = document.getElementById(
          `price-${this.dataset.section}`
        );
        const source = html.getElementById(
          `price-${
            this.dataset.originalSection
              ? this.dataset.originalSection
              : this.dataset.section
          }`
        );
        const skuSource = html.getElementById(
          `Sku-${
            this.dataset.originalSection
              ? this.dataset.originalSection
              : this.dataset.section
          }`
        );
        const skuDestination = document.getElementById(
          `Sku-${this.dataset.section}`
        );
        const inventorySource = html.getElementById(
          `Inventory-${
            this.dataset.originalSection
              ? this.dataset.originalSection
              : this.dataset.section
          }`
        );
        const inventoryDestination = document.getElementById(
          `Inventory-${this.dataset.section}`
        );

        const volumePricingSource = html.getElementById(
          `Volume-${
            this.dataset.originalSection
              ? this.dataset.originalSection
              : this.dataset.section
          }`
        );

        const pricePerItemDestination = document.getElementById(
          `Price-Per-Item-${this.dataset.section}`
        );
        const pricePerItemSource = html.getElementById(
          `Price-Per-Item-${
            this.dataset.originalSection
              ? this.dataset.originalSection
              : this.dataset.section
          }`
        );

        const volumePricingDestination = document.getElementById(
          `Volume-${this.dataset.section}`
        );
        const qtyRules = document.getElementById(
          `Quantity-Rules-${this.dataset.section}`
        );
        const volumeNote = document.getElementById(
          `Volume-Note-${this.dataset.section}`
        );

        if (volumeNote) volumeNote.classList.remove("hidden");
        if (volumePricingDestination)
          volumePricingDestination.classList.remove("hidden");
        if (qtyRules) qtyRules.classList.remove("hidden");

        if (source && destination) destination.innerHTML = source.innerHTML;
        if (inventorySource && inventoryDestination)
          inventoryDestination.innerHTML = inventorySource.innerHTML;
        if (skuSource && skuDestination) {
          skuDestination.innerHTML = skuSource.innerHTML;
          skuDestination.classList.toggle(
            "hidden",
            skuSource.classList.contains("hidden")
          );
        }

        if (volumePricingSource && volumePricingDestination) {
          volumePricingDestination.innerHTML = volumePricingSource.innerHTML;
        }

        if (pricePerItemSource && pricePerItemDestination) {
          pricePerItemDestination.innerHTML = pricePerItemSource.innerHTML;
          pricePerItemDestination.classList.toggle(
            "hidden",
            pricePerItemSource.classList.contains("hidden")
          );
        }

        const price = document.getElementById(`price-${this.dataset.section}`);

        if (price) price.classList.remove("hidden");

        if (inventoryDestination)
          inventoryDestination.classList.toggle(
            "hidden",
            inventorySource.innerText === ""
          );

        const addButtonUpdated = html.getElementById(
          `ProductSubmitButton-${sectionId}`
        );
        this.toggleAddButton(
          addButtonUpdated ? addButtonUpdated.hasAttribute("disabled") : true,
          window.variantStrings.soldOut
        );

        publish(PUB_SUB_EVENTS.variantChange, {
          data: {
            sectionId,
            html,
            variant: this.currentVariant,
          },
        });
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return;
    if (document.getElementById(`variant-radios-${this.dataset.section}`)) {
      const variantRadiosSelector = document.getElementById(
        `variant-radios-${this.dataset.section}`
      );
      // if(variantRadiosSelector.querySelectorAll('fieldset').length !== variantRadiosSelector.querySelectorAll(':checked').length){
      // check conditon behalf on checked + have selected class
      if (
        variantRadiosSelector.querySelectorAll("fieldset").length !==
        variantRadiosSelector.querySelectorAll(":checked.selected").length
      ) {
        disable = true;
        const radiosSelector =
          variantRadiosSelector.querySelectorAll("fieldset");
        let stepText = "add to cart";
        for (let i = 0; i < radiosSelector.length; i++) {
          if (!radiosSelector[i].querySelector(":checked.selected")) {
            let tempText =
              radiosSelector[i].querySelector(".form__label span").innerText;
            tempText = tempText.slice(0, -1);
            stepText = "Select " + tempText;
            break;
          }
        }
        text = stepText;
      }
    }

    if (disable) {
      addButton.classList.add("cartBtnClickDisabled");
      if (text) {
        addButtonText.textContent = text;
        // if not all selected variant option then show price on button
        $(
          "[data-section-id='" + this.dataset.section + "'] .sticky-price"
        ).show();
      }
      
      if($('.spurit-po-wrapper').length > 0) {
        $('.product-form__buttons').addClass('has-preorder-button');
      }

    } else {
      addButton.classList.remove("cartBtnClickDisabled");
      addButtonText.textContent = window.variantStrings.addToCart;
      // if all selected variant option then hide price on button
      $(
        "[data-section-id='" + this.dataset.section + "'] .sticky-price"
      ).hide();

      // Hide Error message when all options are selected
      var error_message = productForm.querySelector('.product-form-error-message')
      if(error_message != null){
        error_message.classList.add('hidden');
      }

      if($('.spurit-po-wrapper').length > 0) {
        $('.product-form__buttons').removeClass('has-preorder-button');
      }
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    const inventory = document.getElementById(
      `Inventory-${this.dataset.section}`
    );
    const sku = document.getElementById(`Sku-${this.dataset.section}`);
    const pricePerItem = document.getElementById(
      `Price-Per-Item-${this.dataset.section}`
    );
    const volumeNote = document.getElementById(
      `Volume-Note-${this.dataset.section}`
    );
    const volumeTable = document.getElementById(
      `Volume-${this.dataset.section}`
    );
    const qtyRules = document.getElementById(
      `Quantity-Rules-${this.dataset.section}`
    );

    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add("hidden");
    if (inventory) inventory.classList.add("hidden");
    if (sku) sku.classList.add("hidden");
    if (pricePerItem) pricePerItem.classList.add("hidden");
    if (volumeNote) volumeNote.classList.add("hidden");
    if (volumeTable) volumeTable.classList.add("hidden");
    if (qtyRules) qtyRules.classList.add("hidden");
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define("variant-selects", VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute("value"))) {
        input.classList.remove("disabled");
      } else {
        input.classList.add("disabled");
      }
    });
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    this.options = fieldsets.map((fieldset, index) => {
      if (
        Array.from(fieldset.querySelectorAll("input")).find(
          (radio) => radio.checked
        )
      ) {
        return Array.from(fieldset.querySelectorAll("input")).find(
          (radio) => radio.checked
        ).value;
      } else {
        return fieldset.querySelector("input").value;
      }
    });
  }
}

customElements.define("variant-radios", VariantRadios);

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      fetch(this.dataset.url)
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement("div");
          html.innerHTML = text;
          const recommendations = html.querySelector("product-recommendations");

          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          if (
            !this.querySelector("slideshow-component") &&
            this.classList.contains("complementary-products")
          ) {
            this.remove();
          }

          if (html.querySelector(".grid__item")) {
            this.classList.add("product-recommendations--loaded");

            // Update card image on swatch hover
            swatch_hover();
          }
        })
        .catch((e) => {
          console.error(e);
        });
    };

    new IntersectionObserver(handleIntersection.bind(this), {
      rootMargin: "0px 0px 400px 0px",
    }).observe(this);
  }
}

customElements.define("product-recommendations", ProductRecommendations);

// Open menu on hover
$("header-menu .mega-menu.mega-menu-hoverActive, .hover-open").hover(
  function () {
    $(this).prop("open", true);
    $("body").css("overflow-y", "auto");
  },
  function () {
    $(this).prop("open", false);
  }
);

// Open header country selector on hover
$(".header-localization:not(.menu-drawer__localization) .disclosure").hover(
  function () {
    $(this).find(".disclosure__button").attr("aria-expanded", true);
    $(this)
      .closest(".localization-form")
      .find(".disclosure__list-wrapper")
      .prop("hidden", false);
  },
  function () {
    $(this).find(".disclosure__button").attr("aria-expanded", false);
    $(this)
      .closest(".localization-form")
      .find(".disclosure__list-wrapper")
      .prop("hidden", true);
  }
);

$(document).ready(function () {
  $(".header__search").click(function () {
    $(".announcement-bar-section").addClass("full-background");
  });

  $(document).on("click", ".modal__close-button .icon", function () {
    $(".announcement-bar-section").removeClass("full-background");
  });

  $(document).on("click", ".modal-overlay", function () {
    $(".announcement-bar-section").removeClass("full-background");
  });

  $(document).on("click", function (event) {
    if (
      !$(event.target).closest(".header__search, .modal__close-button .icon")
        .length
    ) {
      $(".announcement-bar-section").removeClass("full-background");
    }
  });
});

/*******************Wait Element Functions****************/
function waitForElement(selector, callback) {
  if (document.querySelector(selector) !== null) {
    callback();
  } else {
    setTimeout(function () {
      waitForElement(selector, callback);
    }, 100);
  }
}
/*******************Wait Element Functions****************/

// Product Card Swatches on Hover
function swatch_hover() {
  $(".card-product-custom .variant-options .color-input").hover(function () {
    var variant_data_image = $(this).data("variant-image");
    if (
      $(this)
        .closest(".card-product-custom")
        .hasClass("mobile-swiper-enabled") &&
      $(window).width() < 750
    ) {
      var card_media = $(this)
        .closest(".card-product-custom")
        .find(".media .first-image");
    } else {
      var card_media = $(this)
        .closest(".card-product-custom")
        .find(".media img");
    }
    card_media.attr("src", variant_data_image);
    card_media.attr("srcset", variant_data_image);
    $(this).prop("checked", true);

    // Move to first slide when hover on swatches
    var goToSlide = $(this)
      .closest(".card-product-custom.mobile-swiper-enabled")
      .find(".grid-carousel")[0];
    goToSlide.slick.slickGoTo(parseInt(0));
  });
}

// Update card images on change swatches
waitForElement(
  ".card-product-custom .variant-options .color-input",
  function () {
    swatch_hover();
  }
);

$(document).ready(function () {
  // Initially, add the class to the first radio input
  $(".card-product-custom .color-wrapper .color-input:first-child").addClass(
    "radio-checked"
  );

  // When any radio input within the color-wrapper changes
  $(".card-product-custom .color-wrapper .color-input").change(function () {
    // Remove the class from all radio inputs
    $(".card-product-custom .color-wrapper .color-input").removeClass(
      "radio-checked"
    );

    // Add the class to the currently checked input
    $(this).addClass("radio-checked");
  });
});

$(document).ready(function () {
  var header = $(".header-wrapper");
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      header.addClass("scrolled");
    } else {
      header.removeClass("scrolled");
    }
  });
});

// Quickview Product Swatches
function cardLoad() {
  var quickview_btn = document.querySelectorAll(".quick-add__submit");
  for (var i = 0; i < quickview_btn.length; i++) {
    quickview_btn[i].addEventListener("click", function (e) {
      waitForElement("quick-add-modal.quick-add-modal[open]", function () {
        /***********Yotpo Reviews Init ***************/
        var api = new Yotpo.API(yotpo);
        api.refreshWidgets();
        /***********Yotpo Reviews Init ***************/
      });
    });
  }
}
// Reinitialize on Card products
waitForElement(".card-product-custom", function () {
  cardLoad();
  bundleTooltip();
});
// Reinitialize On Recommendation products
waitForElement("product-recommendations .card-product-custom", function () {
  cardLoad();
  bundleTooltip();
});

// Append vertical filters in sort
waitForElement(".facets-vertical-sort", function () {
  var desktop_active_filter = $(".active-facets-desktop");
  $(".facets-vertical-sort").prepend(desktop_active_filter);
});

setTimeout(function () {
  // Make the elements visible
  document
    .querySelectorAll(
      ".facets.facets-vertical-sort, #FacetFiltersForm .active-facets"
    )
    .forEach(function (element) {
      element.style.display = "flex";
    });
}, 500);

// remove all filter js
$(document).ready(function () {
  // Define a function to check and update the class
  function checkAndUpdateClass() {
    var currentUrl = window.location.href;
    if (currentUrl.indexOf("filter") !== -1) {
      $(".active-facets__button-wrapper").addClass("show-remove-all");
    } else {
      $(".active-facets__button-wrapper").removeClass("show-remove-all");
    }
  }

  checkAndUpdateClass();
  setInterval(checkAndUpdateClass, 1500);
});

// Function to wait for an element to become available
function waitForElement(selector, callback) {
  if ($(selector).length) {
    callback();
  } else {
    setTimeout(function () {
      waitForElement(selector, callback);
    }, 100);
  }
}

// Function to add and remove classes on modal open and close
waitForElement(
  "quick-add-modal.quick-add-modal[open] .product-popup-modal__button",
  function () {
    $(document).on(
      "click",
      "quick-add-modal.quick-add-modal[open] .product-popup-modal__button",
      function () {
        var quick_modal_open = $(this)
          .closest(".product-form__input")
          .find(".quick-modal");
        quick_modal_open.addClass("quickview-open");
        quick_modal_open.removeClass("hidden");
        quick_modal_open.attr("open", true);
        $("body").addClass("custom-quickview-open");
      }
    );

    $(document).on(
      "click",
      "quick-add-modal.quick-add-modal[open] .product-popup-modal__toggle",
      function () {
        var quick_modal_close = $(this)
          .closest(".product-form__input")
          .find(".quick-modal");
        quick_modal_close.removeClass("quickview-open");
        quick_modal_close.addClass("hidden");
        quick_modal_close.attr("open", false);
        $("body").removeClass("custom-quickview-open");
      }
    );
  }
);

// Function to handle clicks outside the modal
$(document).on("click", function (event) {
  if (
    !$(event.target).closest(".quick-modal").length &&
    !$(event.target).closest(".product-popup-modal__button").length
  ) {
    $("body").removeClass("custom-quickview-open");
  }
});
// Quickview Size Chart Popup end

// Wrap Size Chart table in div element
waitForElement("table.size-guide", function () {
  $("table.size-guide").wrap('<div class="table-container-wrap"></div>');
});

// Fix Country Selector issue for iOS device
$(".disclosure:not(.announcement-bar) .disclosure__button").click(function () {
  $(this).toggleClass("active");
  $(this)
    .closest(".disclosure")
    .find(".disclosure__list-wrapper")
    .toggleClass("open");
});

$(document).click(function (e) {
  var target_value = e.target.closest(".disclosure__button");
  var disc_button = $(".disclosure:not(.announcement-bar) .disclosure__button");
  if (target_value == null) {
    $(".disclosure:not(.announcement-bar) .disclosure__button").removeClass(
      "active"
    );
    $(
      ".disclosure:not(.announcement-bar) .disclosure__list-wrapper"
    ).removeClass("open");
  }
});

/***** Sticky ATC js start *****/

$.fn.isInViewport = function () {
  if (!$(this).length) return;
  var documentHeightScrolled = $(window).scrollTop();
  var viewportTop = documentHeightScrolled + $("sticky-header").outerHeight(true);
  var viewportBottom = documentHeightScrolled + $(window).height() - ($(this).outerHeight()/2);
  var elementTop = $(this).offset().top;
  var elementBottom = $(this).offset().top + $(this).outerHeight();
  return elementBottom > viewportTop && elementTop < viewportBottom;
};

$(window).on("resize scroll", function () {
  deviceCheck();
});

$("body").on("click", ".modal .variant-button-close", function () {
  $(".main-product .sticky-atc-container").removeClass("popup");
  $("body").removeClass("atc-fixed");
  if (
    $(".product-form__buttons.variant-button button[type='submit']").prop(
      "disabled"
    )
  ) {
    $(".product-form__buttons.variant-button button")
      .attr("type", "button")
      .attr("disabled", false);
  }
  $(".variant-button-close").hide();
});

deviceCheck(); // to default call method after loaded page
var interval;
function deviceCheck() {
  if ($(window).width() <= 749) {
    if (!$(".main-product product-form").isInViewport()) {
      $(".main-product .sticky-atc-container").addClass("modal");
      if (window.defaultformLoaded == 1) {
        if (
          $(".main-product .product-form__buttons.variant-button button").prop(
            "disabled"
          )
        ) {
          $(".main-product .modal .product-form__buttons.variant-button button")
            .attr("type", "button")
            .attr("disabled", false);
        }
      }
      if ($(".price-container>.price").length > 0) {
        interval = setInterval(function () {
          var text = $(".price-container>.price").html();
          $(".sticky-price>.price").html(text);
        }, 1000);
      }
    } else {
      $(".main-product .sticky-atc-container").removeClass("modal");
      if (window.defaultformLoaded == 1) {
        if (
          $(
            ".main-product .product-form__buttons.variant-button .spurit-po-wrapper"
          ).length == 0
        ) {
          if (
            $(
              ".main-product .product-form__buttons.variant-button button[type='submit']"
            ).prop("disabled")
          ) {
            $(".main-product .product-form__buttons.variant-button button")
              .attr("type", "submit")
              .attr("disabled", true);
          }
          if (
            !$(
              ".main-product .product-form__buttons.variant-button button[type='button']"
            ).prop("disabled")
          ) {
            $(
              ".main-product .product-form__buttons.variant-button button[type='button']"
            )
              .attr("type", "submit")
              .attr("disabled", true);
          }
        }
      }
    }
    $(".popup .variant-button-close").show();
  } else {
    $(".variant-button-close").hide();
    $("body").removeClass("atc-fixed");
    clearInterval(interval);
  }
}

// toggle variant toggle class selected and udate text of legend value

$("body").on("click", ".product-form__input label", function () {
  var input_id = "#" + $(this).attr("for");
  var input_form = $(input_id).attr("form");
  var input_name = $(input_id).attr("name");
  $(
    "[form='" +
      input_form +
      "'][name='" +
      input_name +
      "']:not(" +
      input_id +
      ")"
  ).removeClass("selected");
  $(input_id).toggleClass("selected");
  if (
    $("[form='" + input_form + "'][name='" + input_name + "'].selected")
      .length == 0
  ) {
    $(this).closest(".product-form__input").find(".selected-variant").html("");
  } else {
    var compare = $(input_id).attr("variant-compare-at");
    var variantValue = $(input_id).attr("variant-value");
    $(this).closest(".product-form__input").find(".selected-variant").html(variantValue);
    
    // Adding price change on Title variant which is used in Gift Cards
    if (input_name == "Title") {
      if ($(this).text().indexOf("$") >= 0 || $(this).text().indexOf("£") >= 0) {
        $("product-info .price-item--regular").each(function() {
          $(this).text(variantValue);
        });
        $("product-info .price-item--sale").each(function() {
          $(this).text(compare);
        });
      }
    }
  }
});

// update text of add to cart if have variant first time

if ($(".main-product fieldset").length >= 1) {
  var nametext = $("fieldset:first-child input").attr("name");
  $(".main-product .product-form__submit>span").text("Select " + nametext);
}

/***** Sticky ATC js end *****/

// Bundle and save tooltip
function bundleTooltip() {
  if ($(window).width() >= 990) {
    $(".bundle-tooltip-icon").hover(
      function () {
        $(this)
          .closest(".bundle-save")
          .find(".bundle-tooltip")
          .addClass("tooltip-open");
      },
      function () {
        $(".bundle-tooltip").removeClass("tooltip-open");
      }
    );
  } else if ($(window).width() < 990) {
    $(".bundle-tooltip-icon").click(function () {
      var bundle_tooltip = $(".bundle-save .bundle-tooltip");
      if (bundle_tooltip.hasClass("tooltip-open")) {
        bundle_tooltip.removeClass("tooltip-open");
      }
      $(this)
        .closest(".bundle-save")
        .find(".bundle-tooltip")
        .addClass("tooltip-open");
    });
    $(".tooltip-close").click(function () {
      $(this).closest(".bundle-tooltip").removeClass("tooltip-open");
    });

    $(document).click(function (e) {
      var target_value = e.target.closest(".bundle-tooltip-icon");
      var bundle_tooltip = $(".bundle-save .bundle-tooltip");
      if (target_value == null && bundle_tooltip.hasClass("tooltip-open")) {
        bundle_tooltip.removeClass("tooltip-open");
      }
    });
  }
}
$(window).resize(function () {
  bundleTooltip();
});
$(window).on("scroll", function (e) {
  var bundle_tooltip = $(".bundle-save .bundle-tooltip");
  if (bundle_tooltip.hasClass("tooltip-open")) {
    bundle_tooltip.removeClass("tooltip-open");
  }
});

// Adjust position of Desktop Quick view button
waitForElement(".card-product-custom:not(.card-product-custom--mobile-drawer) .quick-add", function () {
  function quickButtonPosition() {
    if ($(window).width() >= 990) {
      var media_height = $(".card-product-custom:not(.card-product-custom--mobile-drawer) .card__media").outerHeight();
      media_height = media_height - 64;
      $(".card-product-custom:not(.card-product-custom--mobile-drawer) .quick-add").css("top", media_height);
    }
  }
  quickButtonPosition();

  $(window).resize(function () {
    quickButtonPosition();
  });
});

// Show Style Options Active
waitForElement(".pants-swatches", function () {
  var activeText = document.querySelector(
    ".pants-swatches .btn-group .active span"
  );
  var insideText = document.querySelector(
    ".pants-swatches .option-wrapper-title span#textName"
  );
  if (activeText != null) {
    var setInsideText = activeText.innerText;
    insideText.innerText = ": " + setInsideText;
  }
});

/***** Read More/ Read Less button *****/

$("#readMoreBtn").click(function () {
  $(".read-more-text").slideToggle();
  var button_text = $(this)
    .text()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "")
    .replace(/^-/, "");
  if (button_text == "read-more") {
    $(this).text("Read less");
  } else {
    $(this).text("Read more");
  }
});

$(document).ready(function () {
  /***** Read More/ Read Less button *****/
  $(".slider-media-gallery").slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow:
      '<button class="slide-number slide-arrow prev-arrow"><svg xmlns="http://www.w3.org/2000/svg" class="icon-slide" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M9.87305 4.00586L6.25949 7.61941L9.87305 11.233" stroke="#2B4592" stroke-width="1.40722" stroke-linejoin="round"/></svg></button>',
    nextArrow:
      '<button class="slide-number slide-arrow next-arrow"><svg xmlns="http://www.w3.org/2000/svg" class="icon-slide" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M9.87305 4.00586L6.25949 7.61941L9.87305 11.233" stroke="#2B4592" stroke-width="1.40722" stroke-linejoin="round"/></svg></button>',
    speed: 700,
    fade: true,
    cssEase: "linear",
    infinite: true,
    asNavFor:
      document.querySelectorAll(".slider-thumbnail li").length > 1
        ? ".slider-thumbnail"
        : "",
  });
  $(".slider-thumbnail").slick({
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    infinite: true,
    vertical: true,
    asNavFor: ".slider-media-gallery",
    verticalSwiping: true,
    focusOnSelect: true,
    cssEase: "linear",
    speed: 500,
  });
  
  // ==== changing image on varaint change ======
  let globalSwiper = null;

  function cleanURL(StringText) {
    let WithoutQuery = StringText.indexOf("?");
    if (WithoutQuery !== -1) {
      StringText = StringText.substring(0, WithoutQuery);
    }
    return StringText;
  }

  const swiperWrapper = this.querySelector(".js-swiper");
  const buttonNext = this.querySelector(
    ".slider__controls-wrapper .swiper-next"
  );
  const buttonPrev = this.querySelector(
    ".slider__controls-wrapper .swiper-prev"
  );

  if (swiperWrapper) {
    const total = swiperWrapper.dataset.sliderTotal;
    const totalInt = parseInt(total, 10);

    globalSwiper = new Swiper(swiperWrapper, {
      slidesPerView: 1,
      loop: true,
      effect: "fade",
      autoHeight: true,
      fadeEffect: {
        crossFade: true,
      },
      navigation: {
        nextEl: buttonNext,
        prevEl: buttonPrev,
      },
    });

    const activeSlideLegend = this.querySelector(".js-current-slide");

    globalSwiper.on("slideChange", (swiperEvent) => {
      const currentSlide = swiperEvent.realIndex + 1;
      if (activeSlideLegend) activeSlideLegend.innerText = currentSlide;
    });

    globalSwiper.el.style.overflow = "hidden";
  }

  $(".label-color").click(function () {
    let selectedImageURL = $(this).attr("data-target-variant-image");
    selectedImageURL = cleanURL(selectedImageURL);
    let selectedIndex = null;

    $(".single-media-wrapper img").each(function () {
      let imagUrl = $(this).attr("src");
      imagUrl = cleanURL(imagUrl);

      if (imagUrl === selectedImageURL) {
        selectedIndex = $(this)
          .closest(".slick-slide")
          .attr("data-slick-index");
      }

      if (selectedIndex != null) {
        $(".slider-media-gallery").slick("slickGoTo", selectedIndex);
        // $('.slider-thumbnail').slick('slickGoTo', selectedIndex, true);
      }
    });
  });
  
  // Adding image change on Title variant which is used in Gift Cards
  $(".label-title").click(function () {
    let selectedIndex = $(this).attr("data-position");
    
    if (selectedIndex != null) {
      $(".slider-media-gallery").slick("slickGoTo", selectedIndex);
      globalSwiper?.slideTo(selectedIndex);
    }
  });
  // ===== mobile slider js ====

  $(".label-color").click(function (event) {
    let selectedImageURLMobile = $(this).attr("data-target-variant-image");
    selectedImageURLMobile = cleanURL(selectedImageURLMobile);
    let selectedIndexMobile = null;
    const productWrapper = event.target.closest(".product");

    if (productWrapper instanceof HTMLElement) {
      const $productWrapper = $(productWrapper);
      const $media = $productWrapper.find(
        `.product__media-mobile img[src^='${selectedImageURLMobile}']`
      );

      if ($media.length < 1) {
        return;
      }

      $media.each(function () {
        let imagUrlMobile = $(this).attr("src");
        imagUrlMobile = cleanURL(imagUrlMobile);

        if (imagUrlMobile === selectedImageURLMobile) {
          selectedIndexMobile =
            parseInt(
              $(this).closest(".swiper-slide").attr("data-swiper-index")
            ) + 1;
        }
        if (selectedIndexMobile != null) {
          globalSwiper?.slideTo(selectedIndexMobile);
        }
      });
    }
  });
});

/***************** Product sticky ATC *****************/
function stickyAddToCart() {
  if ($(window).width() < 750) {
    if (
      $(".product .product-form__submit").isInViewport()
    ) {
      $("#stickyButton").removeClass("visible");
    } else {
      $("#stickyButton").addClass("visible");
    }
  }
}

$(window).on("rezise scroll", function (e) {
  stickyAddToCart();
});

stickyAddToCart();

var stickyButton = $("#stickyButton .sticky_atc");
if (stickyButton != null) {
  stickyButton.on("click", function (e) {
    e.preventDefault();
    if ($(".product .single-product_nested-nav__container").length > 0) {
      var element = $(".product .single-product_nested-nav__container");
    } else if ($(".product .pants-swatches").length > 0) {
      var element = $(".product .pants-swatches");
    } else {
      var element = $(".product .varaint-form");
    }
    $("html, body").animate(
      {
        scrollTop: element.offset().top - 90,
      },
      500
    );
  });
}
/***************** Product sticky ATC *****************/

/***** Product Dynamic Tooltip start *****/

function swatchesTooltip() {
  $(".product-form__input input[type=radio].swatch-color+label").hover(
    function () {
      var tooltip = $(this).find(".color-options-hover");
      var tooltipRect = tooltip[0].getBoundingClientRect();
      if (tooltipRect.right > window.innerWidth) {
        tooltip.addClass("right");
        tooltip.css({
          left: "auto",
          right: "0px",
          transform: "translateX(10px)",
        });
      } else if (tooltipRect.left < 0) {
        tooltip.addClass("left");
        tooltip.css({
          left: "0px",
          right: "auto",
          transform: "translateX(-10px)",
        });
      }
    },
    function () {
      $(
        ".product-form__input input[type=radio].swatch-color+label .color-options-hover"
      ).removeAttr("style");
      $(
        ".product-form__input input[type=radio].swatch-color+label .color-options-hover"
      )
        .removeClass("left")
        .removeClass("right");
    }
  );
}

swatchesTooltip();

$(window).on("resize scroll", function (e) {
  swatchesTooltip();
});

/***** Product Dynamic Tooltip end *****/

/***** Sticky Promo bar *****/
$(document).ready(function () {
  // Append Promo bar to header
  if ($(".sticky-promo-enabled") != null){
    $(".sticky-promo-enabled").prependTo("sticky-header.header-wrapper");
  }
});
/***** Sticky Promo bar *****/

/***** Product Description Summary *****/
document.addEventListener('DOMContentLoaded', function () {

  if (document.querySelector('.template-product')) {
    function getFirstSentence(text) {
      var sentences = text.match(/[^.?!\s][^.?!]*[.?!]/g) || [];
      var firstSentence = sentences.slice(0, 2).join(' ').trim();
      showReadMore = sentences.length > 2 || summaryParagraphs.length > 1 ;
      return firstSentence;
    }

    var showReadMore = false;
    var summaryBlock = document.getElementsByClassName('product__description-summary');
    var summaryContent = document.getElementsByClassName('description-summary-content');
    summaryBlock = summaryBlock[0];
    summaryContent = summaryContent[0];

    // Find and remove ul details from description
    var descriptionBullets = summaryContent.getElementsByClassName('details');
    descriptionBullets = descriptionBullets[0];
    if (descriptionBullets && descriptionBullets.tagName.toLowerCase() === 'ul') {
      descriptionBullets.remove();
    }

    var dynamicContent = {
      firstSentence: '',
      fullContent: '',
    };
    var summaryParagraphs = summaryContent.querySelectorAll('p');
    var firstSentence = getFirstSentence(summaryParagraphs[0].innerHTML, summaryParagraphs.length);

    if (summaryParagraphs) {
      dynamicContent = {
        firstSentence: firstSentence,
        fullContent: summaryContent.innerHTML
      };
    }

    summaryBlock.innerHTML = dynamicContent.firstSentence;
    
    if (showReadMore) {
      var readMoreLink = document.createElement('span');
      readMoreLink.className = 'read-more inline';
      readMoreLink.textContent = 'Read more';
      readMoreLink.onclick = function () {
        toggleSummary();
      };

      summaryBlock.appendChild(readMoreLink);
    }

    function toggleSummary() {
      if (summaryBlock.classList.contains('expanded')) {
        summaryBlock.removeChild(readMoreLink);
        summaryBlock.classList.remove('expanded');
        summaryBlock.innerHTML = dynamicContent.firstSentence;
        summaryBlock.appendChild(readMoreLink);
        readMoreLink.textContent = 'Read more';
        readMoreLink.classList.add('inline');
      } else {
        summaryBlock.classList.add('expanded');
        summaryBlock.innerHTML = dynamicContent.fullContent;
        summaryBlock.appendChild(readMoreLink);
        readMoreLink.textContent = 'Read less';
        readMoreLink.classList.remove('inline');
      }
    }
  }
});
/***** Product Description Summary *****/