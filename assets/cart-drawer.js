const sectionsToRender = [
  {
    id: '#cart-counter',
    section: 'cart-counter',
    selector: '#shopify-section-cart-counter'
  },
  {
    id: '#CartDrawer-Body',
    section: 'cart-drawer',
    selector: '#shopify-section-cart-drawer #CartDrawer-Body'
  }
];

class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener(
      'keyup',
      event => event.code.toUpperCase() === 'ESCAPE' && this.close()
    );
    this.querySelector('#CartDrawer-Overlay').addEventListener(
      'click',
      this.close.bind(this)
    );
    this.setCartLink();
    this.parentElement.addEventListener(
      'shopify:section:select',
      () => this.open()
    );
    this.parentElement.addEventListener(
      'shopify:section:deselect',
      () => this.close()
    );
  }

  setCartLink() {
    const cartLink = document.querySelector('[data-cart-link]');
    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', event => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', event => {
      if (event.code.toUpperCase() !== 'SPACE') return;
      event.preventDefault();
      this.open(cartLink);
    });
  }

  open(opener) {
    if (opener) this.setActiveElement(opener);
    this.classList.add('is-visible');
    this.addEventListener(
      'transitionend',
      () => {
        this.focusOnCartDrawer();
      },
      { once: true }
    );
    bodyScroll.lock(this.querySelector('[role="dialog"]'));
  }

  close() {
    this.classList.remove('is-visible');
    removeTrapFocus(this.activeElement);

    const isHeaderMenuOpen = header.classList.contains('menu-open');

    if (isHeaderMenuOpen) {
      return;
    }

    bodyScroll.unlock(this.querySelector('[role="dialog"]'));
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  focusOnCartDrawer() {
    const containerToTrapFocusOn = this.firstElementChild;
    const focusElement = this.querySelector('[data-drawer-close]');
    trapFocus(containerToTrapFocusOn, focusElement);
  }

  renderContents(response, open = true) {
    this.getSectionsToRender()?.forEach(section => {
      const sectionElement = document.querySelector(section.id);
      sectionElement.innerHTML = this.getSectionInnerHTML(
        response.sections[section.section],
        section.selector
      );
    });
    if (!open) {
      return;
    }

    this.open();
  }

  getSectionsToRender() {
    return sectionsToRender;
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return sectionsToRender;
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
