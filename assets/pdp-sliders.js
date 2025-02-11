// ==== changing image on varaint change ======

$(".quickadd.slider-media-gallery").slick({
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

$(".quickadd.slider-thumbnail").slick({
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

function cleanURL(StringText) {
  let WithoutQuery = StringText.indexOf("?");
  if (WithoutQuery !== -1) {
    StringText = StringText.substring(0, WithoutQuery);
  }
  return StringText;
}

$(".label-color").click(function () {
  let selectedImageURL = $(this).attr("data-target-variant-image");
  selectedImageURL = cleanURL(selectedImageURL);
  let selectedIndex = null;

  $(".single-media-wrapper img").each(function () {
    let imagUrl = $(this).attr("src");
    imagUrl = cleanURL(imagUrl);

    if (imagUrl === selectedImageURL) {
      selectedIndex = $(this).closest(".slick-slide").attr("data-slick-index");
    }

    if (selectedIndex != null) {
      $(".quickadd.slider-media-gallery").slick("slickGoTo", selectedIndex);
    }
  });
});

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
        selectedIndexMobile = parseInt($(this)
          .closest(".swiper-slide")
          .attr("data-swiper-index")) + 1;
      }
      
      if (selectedIndexMobile != null) {
        window.__swiper__gallery?.slideTo(selectedIndexMobile);
      }
    });
  }
});
