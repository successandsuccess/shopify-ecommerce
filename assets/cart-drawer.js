class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);

const refreshElements = () => {
  $('.drawer__header').load(' .drawer__header > *');
  $('#CartDrawer-CartItems').load(' #CartDrawer-CartItems > *');
  $('.drawer__footer').load(' .drawer__footer > *');
}

let freeGifts = {};

// Refresh cart on adding the products through Rebuy upsell widget
waitForElement(".dtc-rebuy-widget .widget-type-cart.widget-display-embed", function () {
  document.addEventListener('rebuy:cart.change', () => {    
    // Update cart live sections on updating Rebuy
    function isOnlyFreeShipping() {
      // Logic to parse free gift items from liquid
      const cartFooter = document.querySelector('.drawer__footer .totals__total-value');
      if (!cartFooter) return false
      const freeGiftsData = cartFooter.dataset.freeGifts;

      // Convert to object
      const result = freeGiftsData.split(',').reduce((acc, item) => {
          const [key, value] = item.split(':').map(str => str.trim());
          acc[key] = value;
          return acc;
      }, {});

      // Sort the result object by keys
      freeGifts = Object.fromEntries(
          Object.entries(result).sort((a, b) => a[0] - b[0])
      );

      return (
        Object.keys(freeGifts).length === 1 && 
        Object.values(freeGifts)[0] === "free shipping"
      );
    }

    // Delay needed to wait for the cart animation
    setTimeout(() => {
      if (isOnlyFreeShipping()) {
        refreshElements();
      } else {
        freeGiftEvaluation();
      }
    }, 500);

    // Update header cart bubble count on updating Rebuy
    var Cart = window.Rebuy.Cart;
    var rebuy_count = Cart.cart.item_count;
    var cart_count = document.querySelector(
      '.cart-count-bubble span[aria-hidden="true"]'
    );
    if (cart_count != null) {
      var cart_count_items = document
        .querySelector(".cart-count-bubble span.visually-hidden")
        .innerText.split(" ");
      cart_count.innerText = rebuy_count;
      cart_count_items[0] = rebuy_count;
      if (rebuy_count == 0) {
        cart_count.closest(".cart-count-bubble").classList.add("empty");
      } else {
        cart_count.closest(".cart-count-bubble").classList.remove("empty");
      }
    }
  });
});

function freeGiftEvaluation() {
  // Function to add a product to the cart with the _freeGift property
  const addProductToCart = (productId) => {
      const drawerInner = document.querySelector('#CartDrawer .drawer__inner');
      drawerInner.classList.add('no-scroll');
      fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: productId,
            quantity: 1,
            properties: { _freeGift: true }, // Add _freeGift property
        }),
      })
      .then(response => response.json())  // Parse JSON response
      .then(data => {
        // Success block: handle the response data
        console.log('Product added successfully:', data);
        drawerInner.classList.remove('no-scroll');
        refreshElements();
      })
      .catch(error => {
        // Error block: handle any errors that occurred
        console.error('Error adding product:', error);
      });
  };

  // Function to remove a product from the cart
  const removeProductFromCart = (lineItemKey) => {
      const drawerInner = document.querySelector('#CartDrawer .drawer__inner');
      drawerInner.classList.add('no-scroll');
      fetch(window.Shopify.routes.root + 'cart/change.js', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: lineItemKey, quantity: 0 }),
      })
      .then(response => response.json())  // Parse JSON response
      .then(data => {
        // Success block: handle the response data
        console.log('Product removed successfully:', data);
        drawerInner.classList.remove('no-scroll');
        refreshElements();
      })
      .catch(error => {
        // Error block: handle any errors that occurred
        console.error('Error removing product:', error);
      });
  };

  const cart = window.Rebuy.Cart.cart;
  const cartTotal = cart.items
    .filter((item) => !(item.properties && item.properties._freeGift)) // Exclude items with _freeGift property
    .reduce((total, item) => total + item.line_price / 100, 0);

  // Determine eligible rewards
  const eligibleGifts = Object.keys(freeGifts).filter((threshold) => parseFloat(cartTotal) >= parseFloat(threshold - 1));
  const eligibleGiftIds = eligibleGifts.map((threshold) => freeGifts[threshold]).filter((gift) => gift !== "free shipping");

  // Check current gifts in the cart
  const currentGiftItems = cart.items.filter((item) =>
      item.properties && item.properties._freeGift // Check if item has _freeGift property
  );

  // Remove ineligible gifts
  for (const item of currentGiftItems) {
      if (!eligibleGiftIds.includes(item.id.toString())) {
          removeProductFromCart(item.key);
      }
  }

  // Add all eligible gifts if not already in the cart
  for (const threshold of eligibleGifts) {
      const gift = freeGifts[threshold];
      if (gift !== "free shipping") {
          const isGiftInCart = currentGiftItems.some((item) => item.id.toString() === gift);
          if (!isGiftInCart) {
              addProductToCart(parseInt(gift));
          }
      }
  }
}
