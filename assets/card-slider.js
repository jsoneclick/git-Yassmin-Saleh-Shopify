if (!customElements.get('card-slider')) {
  class CardSlider extends HTMLElement {
    constructor() {
      super();

      const swiperOptions = JSON.parse(this.getAttribute('data-swiper-options')) || {};

      this.initSlider(swiperOptions);

      if (this.classList.contains('js-testimonials')) {
        window.addEventListener('resize', () => {
          const isMobile = window.innerWidth < mobileWidth;
          const isSlideEffect = this.slider.params.effect === 'slide';

          if (isMobile && !isSlideEffect || !isMobile && isSlideEffect) {
            this.reInitSlider();
          }
        });
      }
    }

    reInitSlider() {
      this.slider.destroy();
      this.initSlider();
    }

    initSlider(swiperOptions) {
      // console.log(swiperOptions);
      let sliderOptions = {
        slidesPerView: 'auto',
        spaceBetween: swiperOptions.spaceBetweenMobile || 2,
        resistanceRatio: 0.72,
        navigation: {
          nextEl: '.swiper-button--next',
          prevEl: '.swiper-button--prev',
        },
        breakpoints: {
          750: {
            slidesPerView: 3,
            spaceBetween: swiperOptions.spaceBetweenDesktop || 2,
          }
        }
      };

      const isArticlesSlider = this.classList.contains('js-articles');

      if (isArticlesSlider) {
        sliderOptions.breakpoints[575] = {
          slidesPerView: 2,
        };
      } else if (this.classList.contains('js-testimonials')) {
        if (window.innerWidth < mobileWidth) {
          sliderOptions.spaceBetween = 4;
          sliderOptions.breakpoints[480] = {
            slidesPerView: 2
          };
          sliderOptions.breakpoints[750].slidesPerView = 1;
        } else {
          sliderOptions = {
            effect: 'fade',
            slidesPerView: 1,
            rewind: true,
            followFinger: false,
            navigation: {
              nextEl: '.swiper-button--next',
              prevEl: '.swiper-button--prev',
            },
          };
        }

      }

      this.slider = new Swiper(this, sliderOptions);
    }
  }

  customElements.define('card-slider', CardSlider);
}
