if (!customElements.get('announcement-bar-slider')) {
  class AnnouncementBarSlider extends HTMLElement {
    constructor() {
      super();

      this.initSlider();

      window.addEventListener('shopify:section:load', e => {
        this.initSlider();
      });
    }

    initSlider() {
      this.slider = new Swiper(this, {
        slidesPerView: 1,
        loop: true,
        allowTouchMove: false,
        autoplay: {
          delay: +this.dataset.autoplayInterval
        }
      });
    }
  }

  customElements.define(
    'announcement-bar-slider',
    AnnouncementBarSlider
  );
}
