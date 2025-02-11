if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.form.querySelector('[name=id]').disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
        var self = this;
        document.addEventListener('rebuy:cart.add', function(event){
          $('.header__icon--cart').load(' .header__icon--cart');
          $('#CartDrawer').load(' #CartDrawer');
          
          async function updateCartDrawer() {
            try {
              const response = await fetch(window.Shopify.routes.root + 'cart.js', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
          
              const data = await response.json();
              if(data.item_count > 0){
                $('cart-drawer').removeClass('is-empty');
              }
              self.cart.open();
            } catch (error) {
              console.error('Error:', error);
            }
          }
          
          updateCartDrawer();
        });

        waitForElement(".spurit-po-wrapper", function () {
          var preorder_button = $('.spurit-po-wrapper');
          if(preorder_button.length > 0) {
            preorder_button.closest('.product-form__buttons').addClass('has-preorder-button');
          }
        });
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        var custom_error_message = this.querySelector('.product-form-error-message');
        var variant_labels = this.closest('.product__info-container')

        if($(this.submitButton).hasClass('cartBtnClickDisabled')){
          if (custom_error_message != null){
            custom_error_message.classList.remove('hidden');

            if (variant_labels) {
              variant_labels.querySelectorAll('variant-radios label').forEach((label) => {
                label.classList.add('shake-me');
              });
            }
          }
        }
        else{
          this.handleErrorMessage();

          this.submitButton.setAttribute('aria-disabled', true);
          this.submitButton.classList.add('loading');
          this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

          const config = fetchConfig('javascript');
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
          delete config.headers['Content-Type'];

          const formData = new FormData(this.form);
          if (this.cart) {
            formData.append(
              'sections',
              this.cart.getSectionsToRender().map((section) => section.id)
            );
            formData.append('sections_url', window.location.pathname);
            this.cart.setActiveElement(document.activeElement);
          }
          config.body = formData;

          fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButton.querySelector('span').classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.open();
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.open();
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading-overlay__spinner').classList.add('hidden');
          });
        }
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    }
  );
  window.defaultformLoaded = 0; // set global variable to check default form is loaded or not

    $("body").on("click", ".main-product .modal .product-form__buttons.variant-button button[type='button']", function() { 
      $('.main-product .sticky-atc-container').addClass('popup');
      $(".main-product .product-form__buttons.variant-button button").attr("type","submit").attr("disabled",true);
      $("body").addClass("atc-fixed");
      $(".variant-button-close").show();
    });
    
     window.defaultformLoaded=1; // if loaded default submit button method then variable window.defaultformLoaded=1
    
     $(".main-product .modal .product-form__buttons.variant-button button").attr("type","button").attr("disabled",false);
}

// Selecting option when the first variant has only one option
let check_option_length = $('.product__info-container .step-option-1 input + label');
if(check_option_length.length == 1){
  setTimeout(() => {
    check_option_length.trigger('click');
  }, 400);
}
