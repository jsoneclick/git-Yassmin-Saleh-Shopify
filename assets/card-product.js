if (!customElements.get('card-product')) {
  class CardProduct extends HTMLElement {
    constructor() {
      super();

      if (this.classList.contains('disabled')) {
        return;
      }

      this.swatches = this.querySelector('.js-swatches');
      this.btnToggleSizes = this.querySelector(
        '.js-btn-toggle-sizes'
      );
      this.defaultMedia = this.querySelector('.js-media-default');

      if (this.btnToggleSizes) {
        this.cartDrawer = document.querySelector('cart-drawer');

        this.duplicateSizes();
        this.setAccessibility();

        this.initialSizeBtns =
          this.sizesContent.querySelectorAll('.js-btn-size');
        this.duplicateSizeBtns =
          this.duplicatedSizesContent.querySelectorAll(
            '.js-btn-size'
          );
        this.sizeBtns = [
          ...this.initialSizeBtns,
          ...this.duplicateSizeBtns
        ];

        this.btnToggleSizes.addEventListener('click', e => {
          e.preventDefault();

          if (!this.duplicatedSizesContainer) {
            return;
          }

          const btnId = this.btnToggleSizes.dataset.id;
          const sizesContent =
            this.duplicatedSizesContainer.querySelector(
              `.js-sizes-content[data-id="${btnId}"]`
            );

          this.showSizes(sizesContent);
        });

        this.duplicatedSizesContent.addEventListener('click', e => {
          const isSizesContent = e.target.classList.contains(
            'js-sizes-content'
          );

          if (!isSizesContent) {
            return;
          }

          const sizesContent = e.target;

          this.hideSizes(sizesContent);
        });

        this.duplicatedSizesContent.addEventListener('keydown', e => {
          const isEscape = e.key === 'Escape';

          if (!isEscape) {
            return;
          }

          this.hideSizes(this.duplicatedSizesContent);
        });

        this.duplicatedSizesContent.addEventListener('keydown', e => {
          const isTabKey = e.key === 'Tab';

          if (!isTabKey) {
            return;
          }

          const isFirstElementFocused =
            document.activeElement === this.firstFocusableElement;
          const isLastElementFocused =
            document.activeElement === this.lastFocusableElement;

          if (e.shiftKey && isFirstElementFocused) {
            this.lastFocusableElement.focus();

            e.preventDefault();
          } else if (!e.shiftKey && isLastElementFocused) {
            this.firstFocusableElement.focus();

            e.preventDefault();
          }
        });

        window.addEventListener('resize', () => {
          const isMobile = window.innerWidth < mobileWidth;
          const isSizeContentVisible =
            this.duplicatedSizesContent.classList.contains(
              'is-visible'
            );
          const hasHover = matchMedia('(hover: hover)').matches;

          if (isMobile || !isSizeContentVisible || !hasHover) {
            return;
          }

          this.hideSizes(this.duplicatedSizesContent);
        });

        this.sizesContent.addEventListener(
          'click',
          this.handleBtnSizeClick.bind(this)
        );
        this.duplicatedSizesContent.addEventListener(
          'click',
          this.handleBtnSizeClick.bind(this)
        );
      }

      if (this.swatches) {
        this.btnSwatches =
          this.swatches.querySelectorAll('.js-btn-swatch');

        this.swatches.addEventListener('change', e => {
          const isBtnSwatch =
            e.target.classList.contains('js-btn-swatch');

          if (!isBtnSwatch) {
            return;
          }

          const btnSwatch = e.target;
          const isSwatchActive =
            btnSwatch.classList.contains('is-active');

          if (isSwatchActive) {
            return;
          }

          const btnSwatchColor = btnSwatch.dataset.color;

          const activeBtnSwatch = this.swatches.querySelector(
            '.js-btn-swatch.is-active'
          );

          const currentVisibleMedia = this.querySelector(
            '[class*="js-media"].is-visible'
          );
          const newVisibleMedia = this.querySelector(
            `.js-media-${btnSwatchColor}`
          );

          activeBtnSwatch.classList.remove('is-active');
          btnSwatch.classList.add('is-active');

          if (newVisibleMedia) {
            currentVisibleMedia.classList.remove('is-visible');
            newVisibleMedia.classList.add('is-visible');
          } else if (this.defaultMedia) {
            currentVisibleMedia.classList.remove('is-visible');
            this.defaultMedia.classList.add('is-visible');
          }

          if (!this.btnToggleSizes) {
            return;
          }

          const sizeMessagesContainer =
            this.sizesContent.querySelector(
              '.js-messages.is-visible'
            );

          sizeMessagesContainer?.classList.remove('is-visible');

          const isRequesting =
            this.classList.contains('is-requesting');

          if (isRequesting) {
            return;
          }

          this.toggleBtns();

          const updateAvailableSizes = async () => {
            try {
              const product = await this.getProduct();

              const matchingColorVariants = product.variants.filter(
                variant => variant.options.includes(btnSwatchColor)
              );

              this.sizeBtns.forEach(sizeBtn => {
                const size = sizeBtn.dataset.size;
                const matchingSizeVariant =
                  matchingColorVariants.find(matchingColorVariant =>
                    matchingColorVariant.options.includes(size)
                  );

                if (
                  matchingSizeVariant &&
                  matchingSizeVariant.available
                ) {
                  sizeBtn.setAttribute('aria-disabled', false);
                  sizeBtn.classList.remove('is-disabled');

                  return;
                }

                sizeBtn.setAttribute('aria-disabled', true);
                sizeBtn.classList.add('is-disabled');
              });
            } catch (error) {
              console.error(error);
            } finally {
              this.toggleBtns();
            }
          };

          updateAvailableSizes();
        });
      }
    }

    async getProduct() {
      try {
        const productResponse = await fetch(
          `${window.Shopify.routes.root}products/${this.dataset.handle}.js`
        );

        const product = await productResponse.json();

        return product;
      } catch (error) {
        console.error(error);
      }
    }

    duplicateSizes() {
      this.sizesContent = this.querySelector('.js-sizes-content');
      this.duplicatedSizesContent = this.sizesContent.cloneNode({
        deep: true
      });
      this.duplicatedSizesContainer = document.querySelector(
        '.js-card-sizes-duplicate'
      );

      this.focusableElements = getFocusableElements(
        this.duplicatedSizesContent
      );

      this.firstFocusableElement = this.focusableElements[0];
      this.lastFocusableElement =
        this.focusableElements[this.focusableElements.length - 1];

      if (!this.duplicatedSizesContainer) {
        this.duplicatedSizesContainer = document.createElement('div');
        this.duplicatedSizesContainer.classList.add(
          'js-card-sizes-duplicate'
        );

        document.body.insertAdjacentElement(
          'beforeend',
          this.duplicatedSizesContainer
        );
      }

      this.duplicatedSizesContainer.insertAdjacentElement(
        'beforeend',
        this.duplicatedSizesContent
      );
    }

    handleBtnSizeClick(e) {
      const isBtnSize = e.target.classList.contains('js-btn-size');

      if (!isBtnSize) {
        return;
      }

      const btnSize = e.target;
      const isDisabled = btnSize.classList.contains('is-disabled');
      const isRequesting = this.classList.contains('is-requesting');

      if (isRequesting || isDisabled) {
        return;
      }

      const btnSwatchActive = this.querySelector(
        '.js-btn-swatch.is-active'
      );

      const selectedSize = btnSize.dataset.size;
      const selectedColor = btnSwatchActive?.dataset.color;

      const targetSizesContent = btnSize.closest('.js-sizes-content');
      const sizeMessagesContainer =
        targetSizesContent.querySelector('.js-messages');
      const sizeMessageSuccess = targetSizesContent.querySelector(
        '.js-success-message'
      );
      const sizeMessageError = targetSizesContent.querySelector(
        '.js-error-message'
      );

      this.toggleBtns();

      const addProductToCart = async () => {
        try {
          const product = await this.getProduct();

          const matchingVariant = product.variants.find(variant => {
            const matchesSize =
              variant.options.includes(selectedSize);
            const matchesColor = btnSwatchActive
              ? variant.options.includes(selectedColor)
              : true;

            return matchesSize && matchesColor;
          });

          if (!matchingVariant) {
            return;
          }

          const isAvailable = matchingVariant.available;

          if (!isAvailable) {
            return;
          }

          const formData = new FormData();
          formData.append('id', matchingVariant.id);
          formData.append('quantity', 1);
          formData.append(
            'sections',
            this.cartDrawer
              .getSectionsToRender()
              ?.map(section => section.section)
          );
          formData.append('sections_url', window.location.pathname);

          const config = fetchConfig('javascript');
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
          delete config.headers['Content-Type'];
          config.body = formData;

          const addToCartResponse = await fetch(
            `${routes.cart_add_url}`,
            config
          );

          const addToCartData = await addToCartResponse.json();

          if (!addToCartResponse.ok) {
            throw new Error(addToCartData.description);
          }

          sizeMessageSuccess.classList.remove('hidden');
          sizeMessageError.classList.add('hidden');

          this.cartDrawer.renderContents(addToCartData, false);
        } catch (error) {
          const errorTextEl =
            sizeMessageError.querySelector('[data-text]');

          sizeMessageSuccess.classList.add('hidden');
          sizeMessageError.classList.remove('hidden');

          errorTextEl.textContent = error.message;
        } finally {
          this.toggleBtns();

          sizeMessagesContainer.classList.add('is-visible');
          setTimeout(() => {
            sizeMessagesContainer.classList.remove('is-visible');
          }, 4000);
        }
      };

      addProductToCart();
    }

    setAccessibility() {
      const duplicatedSizesContentId = `SizesPopup-${this.sizesContent.dataset.id}`;

      this.duplicatedSizesContent.id = duplicatedSizesContentId;
      this.btnToggleSizes.setAttribute('aria-expanded', false);
      this.btnToggleSizes.setAttribute(
        'aria-controls',
        duplicatedSizesContentId
      );
    }

    toggleBtns() {
      this.classList.toggle('is-requesting');
      this.btnSwatches?.forEach(btnSwatch =>
        btnSwatch.toggleAttribute('disabled')
      );

      if (!this.btnToggleSizes) {
        return;
      }

      this.sizesContent.classList.toggle('overlay-visible');
      this.duplicatedSizesContent.classList.toggle('overlay-visible');
    }

    showSizes(container) {
      this.btnToggleSizes.setAttribute('aria-expanded', true);
      container.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
      this.firstFocusableElement.focus();
    }

    hideSizes(container) {
      this.btnToggleSizes.setAttribute('aria-expanded', false);
      container.classList.remove('is-visible');
      document.body.style.overflow = '';
      this.btnToggleSizes.focus();
    }
  }

  customElements.define('card-product', CardProduct);
}
