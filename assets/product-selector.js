class ProductSelector extends HTMLElement {
  constructor() {
    super();
    this.inputWrapper = '[data-input-wrapper]';
    this.variants = JSON.parse(
      this.querySelector('[type="application/json"]').textContent
    );
    this.form = document.querySelector(
      `#ProductForm-${this.dataset.sectionId}`
    );
    this.purchaseOptions = document.querySelector(
      `#Product-Purchase-Options-${this.dataset.sectionId}`
    );
    this.productBar = document.querySelector(
      `#ProductBar-${this.dataset.sectionId}`
    );
    this.installmentsForm = document.querySelector(
      `#Product-Installments-${this.dataset.installmentsFormId}` // check: `${this.dataset.installmentsFormId}`
    );
    this.addEventListener('change', this.onVariantChange);
    this.updateOptions();
    this.updateVariantStatuses();
    this.updateVariant();

    this.form.toggleAddButton(!this.currentVariant.available, '');
  }

  updateVariantStatuses() {
    const optionOneValue = this.querySelector(
      this.inputWrapper
    ).querySelector(':checked').value;
    const selectedOptionOneVariants = this.variants.filter(
      variant => optionOneValue === variant.option1
    );
    const inputWrappers = [
      ...this.querySelectorAll(this.inputWrapper)
    ];

    inputWrappers.forEach((option, index) => {
      if (index === 0) return;

      const previousOptionSelected =
        inputWrappers[index - 1].querySelector(':checked').value;
      const listOfAvailableOptions = selectedOptionOneVariants
        .filter(
          variant =>
            variant.available &&
            variant[`option${index}`] === previousOptionSelected
        )
        .map(variantOption => variantOption[`option${index + 1}`]);

      const optionInputs = [
        ...option.querySelectorAll('input[type="radio"], option')
      ];
      optionInputs.forEach(input => {
        const inputIsDisabled = !listOfAvailableOptions.includes(
          input.getAttribute('value')
        );

        input.disabled = inputIsDisabled;
        if (input.tagName.toLowerCase() === 'option') {
          input
            .closest('dropdown-input')
            .querySelector(
              `button[data-value="${input.value}"]`
            ).disabled = inputIsDisabled;
        }
        if (!this.productBar) return;
        const inputId = input.dataset.id || input.id;
        const productBarInput = this.productBar.querySelector(
          `option[data-id="${inputId}"]`
        );
        if (!productBarInput) return;
        productBarInput.disabled = inputIsDisabled;
      });
    });
  }

  onVariantChange(event) {
    if (event.target.type === 'number') return;
    this.updateOptions();
    if (this.currentVariant === this.getVariantData()) return;

    this.productBarUpdateOptions();
    this.updateVariant();
    this.updateVariantStatuses();
    this.updatePickupAvailability();
    this.form.removeAttribute('data-has-selling-plan');
    this.form.toggleAddButton(false, '');
    this.form.handleErrorMessage();

    if (!this.currentVariant) {
      this.form.toggleAddButton(true, '');
      this.setUnavailable();

      return;
    }

    if (!this.currentVariant.available) {
      ``;
      this.form.toggleAddButton(true, window.variantStrings.soldOut);
    }

    this.updateMedia();
    this.updateURL();
    this.updateVariantInput();
    this.renderProductInfo();
  }

  updateOptions() {
    this.querySelectorAll('input[type="radio"]').forEach(input => {
      input.nextElementSibling.classList.toggle(
        'is-active',
        input.checked
      );
    });
    this.options = Array.from(
      this.querySelectorAll('input[type="radio"]:checked, select'),
      el => ({ name: el.dataset.name || el.name, value: el.value })
    );
  }

  productBarUpdateOptions() {
    Array.from(this.productBar.querySelectorAll('select')).map(
      selector => {
        selector.value = this.options.find(
          option => option.name === selector.name
        ).value;
      }
    );
  }

  updatePickupAvailability() {
    const pickUpAvailabilityNode = document.querySelector(
      'pickup-availability'
    );

    if (!pickUpAvailabilityNode || !this.currentVariant) return;

    pickUpAvailabilityNode.dataset.variantId = this.currentVariant.id;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailabilityNode.setAttribute('available', '');
      pickUpAvailabilityNode.fetchAvailability(
        pickUpAvailabilityNode.dataset.variantId
      );

      return;
    }

    pickUpAvailabilityNode.removeAttribute('available');
    pickUpAvailabilityNode.innerHTML = '';
  }

  updateVariant() {
    this.currentVariant = this.getVariantData();
  }

  getVariantData() {
    return this.options.length
      ? this.variants.find(variant => {
          return !variant.options
            .map(
              (option, index) => this.options[index].value === option
            )
            .includes(false);
        })
      : this.variants[0];
  }

  updateMedia() {
    if (!this.currentVariant || !this.currentVariant.featured_media)
      return;

    const productMedia = document.querySelector('product-media');
    productMedia.setActiveMedia(
      this.currentVariant.featured_media.id
    );
  }

  updateURL(sellingPlanId) {
    if (!this.currentVariant) return;
    const params = new URLSearchParams(window.location.search);
    params[params.has('variant') ? 'set' : 'append'](
      'variant',
      this.currentVariant.id
    );
    if (sellingPlanId) {
      params[params.has('selling_plan') ? 'set' : 'append'](
        'selling_plan',
        sellingPlanId
      );
    } else {
      params.delete('selling_plan');
    }
    window.history.replaceState(
      {},
      '',
      `${this.dataset.url}?${params.toString()}`
    );
  }

  updateVariantInput() {
    const inputs = [
      this.querySelector('[name="id"'),
      this.installmentsForm?.querySelector('[name="id"]')
    ];
    inputs.forEach(input => {
      if (!input) return;
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    // console.log(this.installmentsForm);
  }

  setUnavailable() {
    const submitButton = this.form.submitButton;
    const price = this.querySelector(
      `#Product-Price-${this.dataset.sectionId}`
    );

    if (!submitButton) return;
    submitButton.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('visibility-hidden');
  }

  renderProductInfo() {
    const params = new URLSearchParams(window.location.search);
    params[params.has('variant') ? 'set' : 'append'](
      'variant',
      this.currentVariant.id
    );
    params.append('section_id', this.dataset.sectionId);

    fetch(`${this.dataset.url}?${params.toString()}`)
      .then(response => response.text())
      .then(responseText => {
        const html = new DOMParser().parseFromString(
          responseText,
          'text/html'
        );
        [
          `#Product-Price-${this.dataset.sectionId}`,
          `#Product-Purchase-Options-${this.dataset.sectionId}`
        ].map(liveRegionSelector => {
          const destination = document.querySelector(
            liveRegionSelector
          );
          const source = html.querySelector(liveRegionSelector);

          if (destination && source) {
            destination.classList.remove('visibility-hidden');
            destination.innerHTML = source.innerHTML;
          }
        });
      });
  }
}

customElements.define('product-selector', ProductSelector);
