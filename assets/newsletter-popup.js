class NewsletterPopup extends ModalDialog {
  constructor() {
    super();
    this.delay = this.dataset.delay * 1000;
    this.closed = getCookie('newsletter-closed');
    this.subscribed = getCookie('newsletter-subscribed');

    this.form = this.querySelector('.js-form');

    if (!!this.form) {
      this.form.addEventListener(
        'submit',
        this.onSubscribe.bind(this)
      );
    }
  }

  connectedCallback() {
    // Check if in shopify editor
    if (Shopify.designMode) {
      if (this.dataset.openInDesignMode === 'true') {
        this.show();
      }

      return;
    }

    setTimeout(() => {
      if (this.closed !== null || this.subscribed !== null) return;

      this.show();
    }, this.delay);
  }

  hide() {
    super.hide();
    setCookie('newsletter-closed', 'true');
  }

  onSubscribe() {
    setCookie('newsletter-subscribed', 'true');
    this.hide();
  }
}

customElements.define('newsletter-popup', NewsletterPopup);
