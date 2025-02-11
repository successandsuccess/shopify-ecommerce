document.addEventListener('DOMContentLoaded', loadMobileSwipers);

function loadMobileSwipers() {
  const swipers = document.querySelectorAll('.js-mobile-swiper-wrapper');

  swipers.forEach((swiper) => {
    const productHandle = swiper.getAttribute('data-product-handle');
    const productUrlWithCollection = swiper.getAttribute('data-product-url-with-collection');

    fetch('https://twillory-test.myshopify.com/api/2024-07/graphql.json', {
      method: 'POST',

      headers: {
        'X-Shopify-Storefront-Access-Token': 'b03b8598e9dca24c53124be701a09715',
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        query: `{
          productByHandle(handle: "${productHandle}") {
            images(first: 100) {
              edges {
                node {
                  url(transform: {maxWidth: 320})
                  altText
                }
              }
            }
          }
        }`,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        const imagesEdges = res.data?.productByHandle?.images?.edges;

        if (imagesEdges && Array.isArray(imagesEdges)) {
          const images = imagesEdges.map((edge) => {
            return edge.node;
          });

          const html = images.reduce((html, current, index) => {
            if (!current) {
              return;
            }

            const className = `motion-reduce large-up-hide ${index === 0 ? 'first-image' : ''}`;
            return (
              html +
              `
                <li class="slide">
                  <a href="${productUrlWithCollection}">
                    <img src="${current.url}" alt="${current.alt}" class="${className}" />
                  </a>
                </li>
              `
            );
          }, '');

          return html;
        }
      })
      .then((html) => {
        swiper.innerHTML = html;
      })
      .then(() => {
        $(swiper).slick({
          slidesToShow: 1,
          infinite: true,
          arrows: true,
          prevArrow:
            '<button class="slide-arrow prev-arrow"><svg xmlns="http://www.w3.org/2000/svg" class="icon-slide" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M9.87305 4.00586L6.25949 7.61941L9.87305 11.233" stroke="#2B4592" stroke-width="1.40722" stroke-linejoin="round"/></svg></button>',
          nextArrow:
            '<button class="slide-arrow next-arrow"><svg xmlns="http://www.w3.org/2000/svg" class="icon-slide" width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M9.87305 4.00586L6.25949 7.61941L9.87305 11.233" stroke="#2B4592" stroke-width="1.40722" stroke-linejoin="round"/></svg></button>',
        });
      });
  });
};

document.addEventListener('DOMContentLoaded', loadVariantRadios);

function loadVariantRadios() {
  const variantRadios = document.querySelectorAll('.js-variant-radios');

  function generateVariantRadiosHtml(option, product) {
    let html = `
      <fieldset class="js product-form__input variant-${option.name}">
        <legend class="form__label hidden">${option.name}</legend>
        <div class="variant-options">
      `;

    let hasMoreVariant = false;
    let hasMoreAlreadyRendered = false;
    let hasMoreVariantMobile = false;

    option.values.forEach((value, index) => {
      if (hasMoreAlreadyRendered) {
        return;
      }
      new Image().src = `//twillory-test.myshopify.com/cdn/shop/files/${value}.png`;

      let currentVariantImageUrl = '';

      if (option.name.toLowerCase() !== 'color') {
        return;
      }

      product.variants.forEach((variant) => {
        const optionName = option.name.toLowerCase().replace(' ', '-');
        if (optionName === 'color') {
          const variantTitle = variant.title.split(' / ');
          variantTitle.forEach((variantValue) => {
            if (variantValue === value && variant.image) {
              currentVariantImageUrl = variant.image.url;
            }
          });
        }
      });

      const optionSize = option.values.length;
      if (index > 4 && optionSize > 4) {
        hasMoreVariant = true;
      }

      const optionSizeMobile = option.values.length;
      if (index > 4 && optionSizeMobile > 4) {
        hasMoreVariantMobile = true;
      }

      html += `
        <span class="color-wrapper${hasMoreVariant ? ' hidden' : ''}${hasMoreVariantMobile ? ' medium-hide small-hide' : ''}">
          <input type="radio"
            id="${product.id}-${option.position}-${index}"
            aria-id="test-${option.position}-${index}"
            name="${option.name}-${product.id}"
            value="${value}"
            class="color-input"
            ${option.selected_value === value ? 'checked="checked"' : ''}
            data-variant-image="${currentVariantImageUrl}"
          />
          <label for="${product.id}-${option.position}-${index}"
            class="color-label"
            style="
              background-image: url(//twillory-test.myshopify.com/cdn/shop/files/${value}.png), url(${currentVariantImageUrl});
              background-color: ${value.split(' ').pop()};
            "
            data-option="${value}">
            <span class="option-label">${value}</span>
          </label>
        </span>`;

      if (hasMoreVariant && !hasMoreAlreadyRendered) {
        html += `<span class="more-variants small-hide medium-hide">
            + ${optionSize - 4} more
          </span>`;
        if (hasMoreVariantMobile) {
          html += `<span class="more-variants large-up-hide">
              + ${optionSize - 4} more
            </span>`;
        }
        hasMoreAlreadyRendered = true;
        return;
      }
    });

    html += `
      </div>
    </fieldset>`;

    return html;
  }

  variantRadios.forEach((variantRadio) => {
    const productHandle = variantRadio.getAttribute('data-product-handle');

    fetch(`https://twillory-test.myshopify.com/api/2024-07/graphql.json`, {
      method: 'POST',

      headers: {
        'X-Shopify-Storefront-Access-Token': 'b03b8598e9dca24c53124be701a09715',
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        query: `
          query ProductVariants($productHandle: String!) {
            productByHandle(handle: $productHandle) {
               options {
                name
                values
              }
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    image {
                      url(transform: {maxWidth: 320})
                      altText
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          productHandle: productHandle,
        },
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Extract relevant data from the GraphQL response
        const product = data.data.productByHandle;
        const options = product.options;
        const variants = product.variants.edges.map((edge) => edge.node);

        // Generate HTML for variant radios using the function
        const colors = options.find((option) => option.name.toLowerCase() === 'color');

        const variantRadiosHtml = generateVariantRadiosHtml(colors, { variants, id: product.id });

        if (variantRadio) {
          variantRadio.innerHTML = variantRadiosHtml;
        } else {
          console.error('Variant radios container not found.');
        }
      })
      .then(() => {
        $('.product-card-wrapper .color-wrapper .color-input:first-child').addClass('radio-checked');

        $('.card-product-custom .variant-options .color-input').hover(function () {
          var variant_data_image = $(this).data('variant-image');
          if ($(this).closest('.card-product-custom').hasClass('mobile-swiper-enabled') && $(window).width() < 750) {
            var card_media = $(this).closest('.card-product-custom').find('.media .first-image');
          } else {
            var card_media = $(this).closest('.card-product-custom').find('.media img');
          }
          card_media.attr('src', variant_data_image);
          card_media.attr('srcset', variant_data_image);
          $(this).prop('checked', true);

          // Move to first slide when hover on swatches
          var goToSlide = $(this).closest('.card-product-custom.mobile-swiper-enabled').find('.grid-carousel')[0];
          goToSlide.slick.slickGoTo(parseInt(0));
        });
      })
      .catch((error) => {
        console.error('Error fetching variant data:', error);
      });
  });
};
