/**
 * Uses Swiper package to create a carousel for product media
 * More info: https://swiperjs.com/
 */
class ProductMedia extends HTMLElement {
  constructor() {
    super();

    this.selectors = {
      slider: '[data-slider]',
      mediaItem: '[data-media-id]',
      modalOpeners: '[data-modal-opener-id]',
      zoomContainer: '[data-zoom-container]',
      zoomImages: '[data-pswp-image]',
      btnXr: '[data-shopify-xr]',
      withThumbs: '[data-with-thumbs]',
    };
    this.selectedMediaIndex =
      Number(
        this.querySelector(this.selectors.slider).querySelector(
          '[data-selected]'
        )?.dataset.index
      ) || 0;

    this.settings = {
      sliderElement: this.querySelector(this.selectors.slider),
      sliderInstance: null,
      options: {
        initialSlide: this.selectedMediaIndex,
        navigation: {
          prevEl: this.querySelector('.swiper-button--prev'),
          nextEl: this.querySelector('.swiper-button--next')
        },
        spaceBetween: 2,
        watchOverflow: true,
        autoHeight: this.dataset.autoHeight === 'true',
        on: {
          slideChangeTransitionEnd: swiper => {
            this.setActiveModalOpener(swiper);
          }
        }
      }
    };
  }

  connectedCallback() {
    this.init();
  }

  init() {
    const [zoomContainerWidth, zoomContainerHeight, closeIcon] = [
      this.offsetWidth,
      this.offsetHeight,
      this.querySelector('[data-close-icon')
    ];

    const photoSwipeLightboxInstance = new PhotoSwipeLightbox({
      gallery: this.selectors.zoomImages,
      appendToEl: this.querySelector(this.selectors.zoomContainer),
      initialZoomLevel: 'fill',
      secondaryZoomLevel: 1,
      maxZoomLevel: 2,
      getViewportSizeFn: function (options, pswp) {
        return {
          x: zoomContainerWidth,
          y: zoomContainerHeight
        };
      },
      pswpModule: PhotoSwipe
    });
    photoSwipeLightboxInstance.addFilter(
      'uiElement',
      (element, data) => {
        if (data.name === 'close') {
          element.innerHTML = closeIcon.innerHTML;
        }
        return element;
      }
    );

    photoSwipeLightboxInstance.init();
    if (!this.settings.sliderElement) return;

    this.settings.sliderInstance = new Swiper(
      this.settings.sliderElement,
      this.settings.options
    );
  }

  setActiveMedia(id) {
    const mediaFound = Array.from(
      this.querySelectorAll(this.selectors.mediaItem)
    ).find(media => Number(media.dataset.mediaId) === id);
    if (!mediaFound) return;
    this.settings.sliderInstance.slideTo(
      Number(mediaFound.dataset.index)
    );


    // const thumbs = this.settings.sliderInstance.thumbs.swiper;
    // thumbs.slideTo(Number(mediaFound.dataset.index));

  }

  setActiveModalOpener(swiper) {
    const activeSlide = swiper.slides.filter(sliderSlide =>
      sliderSlide.classList.contains('swiper-slide-active')
    )[0];
    if (!activeSlide) return;
    const activeMediaId = activeSlide.dataset.mediaId;
    this.querySelector(
      `${this.selectors.modalOpeners}.is-active`
    )?.classList.remove('is-active');
    this.querySelector(
      `${this.selectors.modalOpeners} [data-media-id="${activeMediaId}"]`
    )?.parentElement.classList.add('is-active');

    const isModel = activeSlide.dataset.mediaType === 'model';

    if (!isModel) return;

    const btnXr = this.querySelector(this.selectors.btnXr);
    btnXr.dataset.shopifyModel3dId = activeMediaId;
  }
}

customElements.define('product-media', ProductMedia);
