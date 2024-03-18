if (!customElements.get('trust-indicators-slider')) {
  class TrustIndicatorsSlider extends HTMLElement {
    constructor() {
      super();

      const swiperOptions = JSON.parse(this.getAttribute('data-swiper-options')) || {};

      this.initSlider(swiperOptions);
    }

    initSlider(swiperOptions) {
      this.slider = new Swiper(this, {
        slidesPerView: 1.1,

        spaceBetween: swiperOptions.spaceBetweenMobile || 2,
        breakpoints: {
          990: {
            enabled: true,
            spaceBetween: swiperOptions.spaceBetweenDesktop || 2,
            slidesPerView: 3,
            loop: false,
          }
        }
      });
    }
  }

  customElements.define('trust-indicators-slider', TrustIndicatorsSlider);
}
