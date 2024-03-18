class ProductBar extends HTMLElement {
  constructor() {
    super();
    this.changeEvent = new Event('change', { bubbles: true });
  }

  connectedCallback() {
    this.submitButton = this.querySelector('[name="add"]');
    this.productSelectors = Array.from(
      document
        .querySelector('product-selector')
        ?.querySelectorAll('input[type="radio"], select')
    );
    this.debouncedScroll = debounce(
      () => this.toggleVisibility(),
      300
    );
    this.scrollToFormButton = this.querySelector(
      '[data-purchase-options-button]'
    );
    this.setHandlers();
  }

  setHandlers() {
    this.addEventListener('change', event => {
      this.onChange({
        name: event.target.dataset.name || event.target.name,
        value: event.target.value
      });
    });

    window.addEventListener(
      'scroll',
      this.debouncedScroll.bind(this)
    );
    window.addEventListener(
      'resize',
      this.debouncedScroll.bind(this)
    );
    window.addEventListener('load', this.toggleVisibility());
    this.scrollToFormButton?.addEventListener(
      'click',
      this.scrollToForm.bind(this)
    );
  }

  toggleVisibility() {
    const formActions = document.querySelector('product-form');

    this.classList.toggle(
      'is-hidden',
      window.scrollY < getOffsetTop(formActions) ||
        window.scrollY + window.innerHeight >=
          document.body.offsetHeight
    );
  }

  scrollToForm() {
    const target = document.querySelector('product-form');
    const offset =
      document.querySelector('header')?.clientHeight || 0;
    const scrollPosition = target.offsetTop - offset;

    window.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  }

  onChange({ name, value }) {
    const matchedSelector = this.productSelectors
      .filter(
        selector =>
          selector.dataset.name === name || selector.name === name
      )
      .find(selector => {
        if (selector.type === 'select-one') return selector;
        return selector.value === value;
      });
    if (!matchedSelector)
      throw new Error(`Selector not found with name ${name}`);

    if (matchedSelector.type === 'radio') {
      matchedSelector.click();
      return;
    }

    matchedSelector.value = value;
    Array.from(matchedSelector.options).map(option =>
      option.toggleAttribute('selected', option.value === value)
    );
    matchedSelector.dispatchEvent(this.changeEvent);
  }
}

customElements.define('product-bar', ProductBar);
