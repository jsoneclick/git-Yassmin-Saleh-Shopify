class HeroSlider extends HTMLElement {
  constructor() {
    super();

    this.mountSlider();

    window.addEventListener('shopify:block:select', e => {
      const selectedSlideIndex = +e.target.dataset.index;

      this.slider.slideTo(selectedSlideIndex, 600);
    });
  }

  mountSlider() {
    const autoplayOptions = {
      delay: this.dataset.autoplayInterval
    };

    this.slider = new Swiper(this, {
      effect: 'fade',
      rewind: true,
      slidesPerView: 1,
      speed: 600,
      followFinger: false,
      navigation: {
        nextEl: '.swiper-button--next',
        prevEl: '.swiper-button--prev'
      },
      autoplay:
        this.dataset.autoplay === 'true' ? autoplayOptions : false
    });
  }
}

customElements.define('hero-slider', HeroSlider);
