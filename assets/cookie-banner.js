/**
 * Note: For this to work tracking must be set to collected after consent
 * in Online Store -> Preferences -> Customer Privacy.
 *
 * This uses Shopify consent-tracking-api: https://shopify.dev/api/consent-tracking
 */

(() => {
  if (customElements.get('cookie-banner')) {
    return;
  }

  class CookieBanner extends HTMLElement {
    constructor() {
      super();
      this.activeClass = 'is-visible';
      this.actionsSelector = '[data-action]';

      // selectors
      this.actions = this.querySelectorAll(this.actionsSelector);

      this.actions?.forEach(action => {
        action.addEventListener(
          'click',
          this.performAction.bind(this)
        );
      });
    }

    connectedCallback() {
      if (
        Shopify.designMode &&
        this.dataset.openInDesignMode === 'true'
      ) {
        this.classList.add(this.activeClass);
        return;
      }

      this.loadShopifyScript();
    }

    loadShopifyScript() {
      if (typeof window.Shopify !== 'undefined') {
        window.Shopify.loadFeatures(
          [
            {
              name: 'consent-tracking-api',
              version: '0.1'
            }
          ],
          error => {
            if (error) throw error;
            this.initBanner();
          }
        );
      }
    }

    initBanner() {
      const userTrackingConsent =
        window.Shopify.customerPrivacy.getTrackingConsent();
      if (userTrackingConsent === 'no_interaction') {
        this.classList.add(this.activeClass);
      }
    }

    performAction(event) {
      event.preventDefault();

      if (this.dataset.openInDesignMode === 'true') {
        this.classList.remove(this.activeClass);

        return;
      }

      const action =
        event.target.getAttribute('id') !== null
          ? event.target.getAttribute('id')
          : event.target.parentElement.getAttribute('id');
      if (!action) return;

      window.Shopify.customerPrivacy.setTrackingConsent(
        action === 'accept-cookies',
        () => {
          this.classList.remove(this.activeClass);
        }
      );
    }
  }

  customElements.define('cookie-banner', CookieBanner);
})();
