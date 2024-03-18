const body = document.querySelector('body');
let header = document.querySelector(
  '#shopify-section-header header, #shopify-section-main-password-header header'
);
let announcementBar = document.querySelector('.js-announcement-bar');
const mobileMediumWidth = 575;
const mobileWidth = 750;
const tabletWidth = 990;
const windowDynamicEvents = ['scroll', 'resize'];

windowDynamicEvents.forEach(eventType => {
  window.addEventListener(eventType, () => {
    setRootCustomProperties();
  });
});

setRootCustomProperties();

document.addEventListener('shopify:section:load', function () {
  header = document.querySelector(
    '#shopify-section-header header, #shopify-section-main-password-header header'
  );
  announcementBar = document.querySelector('.js-announcement-bar');

  setRootCustomProperties();
});

function setRootCustomProperties() {
  document.documentElement.style.setProperty(
    '--viewport-height',
    `${window.innerHeight}px`
  );
  document.documentElement.style.setProperty(
    '--header-height',
    `${parseInt(header.offsetHeight)}px`
  );

  if (!announcementBar) {
    return;
  }

  let announcementBarTop = 0;

  announcementBarTop =
    announcementBar.getBoundingClientRect().y +
    announcementBar.offsetHeight;

  if (announcementBarTop <= 0) {
    announcementBarTop = 0;
  }

  document.documentElement.style.setProperty(
    '--announcement-bar-top',
    `${parseInt(announcementBarTop)}px`
  );
}

const bodyScroll = {
  lock(container) {
    bodyScrollLock.disableBodyScroll(container);
  },
  unlock(container) {
    bodyScrollLock.enableBodyScroll(container);
  },
  clear() {
    bodyScrollLock.clearAllBodyScrollLocks();
  }
};

const onKeyUpEscape = event => {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus({
    preventScroll: true
  });
};

const getFocusableElements = container => {
  return Array.from(
    container.querySelectorAll(
      'summary, a[href], button:enabled, [tabindex]:not([tabindex^="-"]), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe'
    )
  );
};

document
  .querySelectorAll('[id^="Details-"] summary')
  .forEach(summary => {
    summary.setAttribute('role', 'button');
    summary.setAttribute(
      'aria-expanded',
      summary.parentNode.hasAttribute('open')
    );

    if (summary.nextElementSibling.getAttribute('id')) {
      summary.setAttribute(
        'aria-controls',
        summary.nextElementSibling.id
      );
    }

    summary.addEventListener('click', event => {
      event.currentTarget.setAttribute(
        'aria-expanded',
        !event.currentTarget.closest('details').hasAttribute('open')
      );
    });

    if (summary.closest('header-drawer')) return;
    summary.parentElement.addEventListener('keyup', onKeyUpEscape);
  });

const trapFocusHandlers = {};

const removeTrapFocus = (elementToFocus = null) => {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener(
    'focusout',
    trapFocusHandlers.focusout
  );
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus)
    elementToFocus.focus({
      preventScroll: true
    });
};

const trapFocus = (container, elementToFocus = container) => {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = event => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener(
      'keydown',
      trapFocusHandlers.keydown
    );
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();
};

const serializeForm = form => {
  const obj = {};
  const formData = new FormData(form);
  for (const key of formData.keys()) {
    obj[key] = formData.get(key);
  }
  return JSON.stringify(obj);
};

const deepClone = obj => {
  return JSON.parse(JSON.stringify(obj));
};

const handleize = str => str.replace(/[ /_]/g, '-').toLowerCase();

const decode = str => decodeURIComponent(str).replace(/\+/g, ' ');

const getOffsetTop = element => {
  let offsetTop = 0;

  do {
    if (!isNaN(element.offsetTop)) {
      offsetTop += element.offsetTop;
    }
  } while ((element = element.offsetParent));

  return offsetTop;
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.details = this.querySelector('details');
    this.summary = this.querySelector('summary');
    this.drawer = this.querySelector('.js-drawer');
    this.btnsCloseDrawer = this.querySelectorAll(
      '.js-btn-close-drawer'
    );
    this.btnsCloseDrawer = [...this.btnsCloseDrawer].filter(
      btnCloseDrawer =>
        this.drawer === btnCloseDrawer.closest('.js-drawer')
    );
    this.elementToFocus =
      this.querySelector('.js-drawer-focus-element') ||
      this.btnsCloseDrawer[0];
    this.toggleButtons = [this.summary, ...this.btnsCloseDrawer];
    this.isParentDrawerOpen = false;
    this.predictiveSearch = this.querySelector('predictive-search');

    this.setInitialAccessibilityAttr();

    this.toggleButtons.forEach(toggleButton => {
      toggleButton.addEventListener('click', e => {
        e.preventDefault();

        this.toggleDrawer();
      });
    });

    this.addEventListener('keydown', e => {
      const isEscapeKey = e.key === 'Escape';
      const isDrawerOpen =
        this.details.classList.contains('menu-opening');
      const nestedOpenDrawer =
        this.details.querySelector('details[open]');

      if (!isEscapeKey || nestedOpenDrawer || !isDrawerOpen) {
        return;
      }

      if (
        this.predictiveSearch &&
        this.predictiveSearch.input == document.activeElement
      ) {
        return;
      }

      this.toggleDrawer();
    });

    this.toggleTrapFocus();
  }

  toggleDrawer() {
    const isDrawerTransitioning = this.details.classList.contains(
      'drawer-transitioning'
    );

    if (isDrawerTransitioning) {
      return;
    }

    this.drawer.addEventListener(
      'transitionstart',
      e => {
        this.details.classList.add('drawer-transitioning');
      },
      { once: true }
    );

    const isDetailsOpen =
      this.details.classList.contains('menu-opening');

    if (!isDetailsOpen) {
      this.details.setAttribute('open', '');
      this.toggleButtons.forEach(toggleButton => {
        toggleButton.setAttribute('aria-expanded', true);
      });

      this.details.classList.add('menu-opening');

      const bodyHasOverflow = body.style.overflow === 'hidden';

      if (bodyHasOverflow) {
        this.parentDrawer = this.closest('.js-drawer');

        this.isParentDrawerOpen = true;
        this.parentDrawer.style.overflow = 'hidden';
      } else {
        body.style.overflow = 'hidden';
      }
    } else {
      this.details.classList.remove('menu-opening');
    }

    const handleDropdownTransition = e => {
      if (
        e.target !== this.drawer ||
        e.propertyName !== 'visibility'
      ) {
        return;
      }

      this.details.classList.remove('drawer-transitioning');
      this.elementToFocus.focus({
        preventScroll: true
      });

      if (!isDetailsOpen) {
        return;
      }

      this.toggleButtons.forEach(toggleButton => {
        toggleButton.setAttribute('aria-expanded', false);
      });
      this.details.removeAttribute('open');
      this.summary.focus({
        preventScroll: true
      });

      this.isParentDrawerOpen
        ? (this.parentDrawer.style.overflow = '')
        : (body.style.overflow = '');
      e.target.removeEventListener(e.type, handleDropdownTransition);
    };

    this.drawer.addEventListener(
      'transitionend',
      handleDropdownTransition
    );
  }

  instantlyHideDrawer() {
    this.toggleButtons.forEach(toggleButton => {
      toggleButton.setAttribute('aria-expanded', false);
    });
    this.details.classList.remove('menu-opening');
    this.details.removeAttribute('open');
    body.style.overflow = '';
  }

  toggleTrapFocus(container = this.drawer) {
    document.addEventListener('focusin', e => {
      const isDrawerOpen =
        this.details.classList.contains('menu-opening');

      if (!isDrawerOpen) {
        return;
      }

      const openDrawer = e.target.closest(
        'details.menu-opening .js-drawer'
      );
      const nestedOpenDrawer = this.details.querySelector(
        'details.menu-opening'
      );

      if (openDrawer === this.drawer || nestedOpenDrawer) {
        return;
      }

      e.preventDefault();

      const focusableElements = getFocusableElements(container);
      const focusedElementDOMPosition =
        container.compareDocumentPosition(e.target);

      const visibleFocusableElements = focusableElements.filter(
        focusableElement => {
          const isHidden =
            getComputedStyle(focusableElement).display === 'none';

          if (isHidden) {
            return;
          }

          const isSummary = focusableElement.tagName === 'SUMMARY';
          const focusableElementDetails =
            focusableElement.closest('details');
          const parentFocusableElementDetails =
            focusableElementDetails.parentElement.closest('details');
          const focusableElementDrawer =
            focusableElementDetails.querySelector('.js-drawer');
          const isThisDrawerOrDetails = focusableElementDrawer
            ? focusableElementDrawer === this.drawer
            : focusableElementDetails === this.details;

          return (
            isThisDrawerOrDetails ||
            (isSummary &&
              parentFocusableElementDetails.hasAttribute('open'))
          );
        }
      );

      const firstFocusableElement = visibleFocusableElements[0];
      const lastFocusableElement =
        visibleFocusableElements[visibleFocusableElements.length - 1];

      if (focusedElementDOMPosition >= 4) {
        firstFocusableElement.focus({
          preventScroll: true
        });

        return;
      }

      lastFocusableElement.focus({
        preventScroll: true
      });
    });
  }

  setInitialAccessibilityAttr() {
    const isDetailsOpen = this.details.hasAttribute('open');

    this.summary.setAttribute('role', 'button');
    this.summary.setAttribute('aria-controls', this.drawer.id);
    this.summary.setAttribute('aria-expanded', isDetailsOpen);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();

    window.addEventListener('resize', e => {
      const isMobileDrawer = this.classList.contains('mobile-drawer');

      if (!isMobileDrawer) {
        return;
      }

      const isDesktop = window.innerWidth < tabletWidth;
      const isMenuOpen =
        this.details.classList.contains('menu-opening');

      if (isDesktop || !isMenuOpen) {
        return;
      }

      this.instantlyHideDrawer();
    });
  }

  instantlyHideDrawer() {
    header.classList.remove('menu-open');
    super.instantlyHideDrawer();
  }

  toggleDrawer() {
    const isDrawerTransitioning = this.details.classList.contains(
      'drawer-transitioning'
    );

    if (isDrawerTransitioning) {
      return;
    }

    header.classList.toggle('menu-open');
    super.toggleDrawer();
  }

  toggleTrapFocus() {
    super.toggleTrapFocus(this.details);
  }
}

customElements.define('header-drawer', HeaderDrawer);

class DesktopDrawer extends MenuDrawer {
  constructor() {
    super();

    window.addEventListener('resize', e => {
      const isDesktop = window.innerWidth < tabletWidth;
      const isMenuOpen =
        this.details.classList.contains('menu-opening');

      if (!isDesktop || !isMenuOpen) {
        return;
      }

      this.instantlyHideDrawer();
    });
  }
}

customElements.define('desktop-drawer', DesktopDrawer);

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach(video => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + 'pauseVideo' + '","args":""}',
      '*'
    );
  });
  document.querySelectorAll('.js-vimeo').forEach(video => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach(video => video.pause());
  document.querySelectorAll('product-model').forEach(model => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

const debounce = (fn, wait) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
};

const fetchConfig = (type = 'json') => {
  return {
    method: 'POST',
    headers: {
      'Content-Type': `application/${type}`,
      'Accept': `application/${type}`
    }
  };
};

class QuantityInput extends HTMLElement {
  constructor() {
    super();

    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });

    this.querySelectorAll('button').forEach(button =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();

    const previousValue = this.input.value;

    event.target.name === 'increment'
      ? this.input.stepUp()
      : this.input.stepDown();

    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);
  }
}

customElements.define('quantity-input', QuantityInput);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;

    button.addEventListener('click', () => {
      const modal = document.querySelector(
        this.getAttribute('data-modal')
      );

      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class ModalDialog extends HTMLElement {
  constructor() {
    super();

    this.dialogHolder = this.querySelector('[role="dialog"]');
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      'click',
      this.hide.bind(this, false)
    );
    this.addEventListener('keyup', event => {
      if (event.code?.toUpperCase() === 'ESCAPE') this.hide();
    });
    this.addEventListener('click', event => {
      if (event.target === this) this.hide();
    });
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    bodyScroll.lock(this.dialogHolder);
    this.setAttribute('open', '');
    trapFocus(this, this.dialogHolder);
    window.pauseAllMedia();
  }

  hide() {
    bodyScroll.unlock(this.dialogHolder);
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

function isIOS() {
  return (
    /iPad|iPhone|iPod|iPad Simulator|iPhone Simulator|iPod Simulator/.test(
      navigator.platform
    ) ||
    (navigator.platform === 'MacIntel' &&
      navigator.maxTouchPoints > 1)
  );
}
class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(
        this.querySelector(
          'template'
        ).content.firstElementChild.cloneNode(true)
      );

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(
        content.querySelector('video, model-viewer, iframe')
      );

      if (isIOS()) {
        deferredElement.controls = true;
      }

      deferredElement.play && deferredElement.play();

      if (focus) deferredElement.focus();
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

/**
 * Additions
 */

class LocalizationForm extends HTMLElement {
  constructor() {
    super();

    this.form = this.querySelector('form');
    this.localizationInputElements = this.querySelectorAll(
      '[name="country_code"], [name="language_code"]'
    );

    this.localizationInputElements.forEach(inputElement => {
      inputElement.addEventListener('input', () => {
        this.form.submit();
      });
    });
  }
}

customElements.define('localization-form', LocalizationForm);

class AccordionDefault extends HTMLElement {
  constructor() {
    super();

    this.hideMultiple = this.hasAttribute('data-hide-multiple');
    this.summaryElements = this.querySelectorAll('summary');

    this.setInitialAccessibilityAttr();

    this.addEventListener('click', e => {
      const isBtn = e.target.classList.contains('js-btn');

      if (!isBtn) {
        return;
      }

      e.preventDefault();

      this.toggleDropdown(e.target);
      this.collapseInactiveItems();
    });

    this.addEventListener('keydown', e => {
      const isEscapeKey = e.key === 'Escape';

      if (!isEscapeKey) {
        return;
      }

      const closestOpenDetails = document.activeElement.closest(
        'details.is-active'
      );

      if (!closestOpenDetails) {
        return;
      }

      const btn = closestOpenDetails.querySelector('summary');

      this.toggleDropdown(btn);
      this.collapseInactiveItems();
    });
  }

  collapseInactiveItems() {
    if (!this.hideMultiple) return;
    const allSummaryElements = document.querySelectorAll(
      'accordion-default summary'
    );
    allSummaryElements.forEach(summary => {
      const accordionDefault = summary.closest('accordion-default');
      accordionDefault.toggleDropdown(summary, true);
    });
  }

  toggleDropdown(btn, forceClose) {
    const dropdown = btn.nextElementSibling;
    const isDropdownTransitioning = dropdown.classList.contains(
      'is-transitioning'
    );

    if (isDropdownTransitioning) {
      return;
    }

    const details = btn.parentElement;

    if (forceClose) {
      details.classList.remove('is-active');
      details.removeAttribute('open');
      btn.setAttribute('aria-expanded', false);
      dropdown.style.height = '0px';
      return;
    }

    details.classList.toggle('is-active');

    const isDetailsActive = details.classList.contains('is-active');

    btn.setAttribute('aria-expanded', isDetailsActive);

    if (isDetailsActive) {
      details.setAttribute('open', '');

      dropdown.style.height = `${dropdown.scrollHeight}px`;
    } else {
      dropdown.style.height = `${dropdown.scrollHeight}px`;

      setTimeout(() => {
        dropdown.style.height = '0px';
      }, 0);
    }

    dropdown.classList.add('is-transitioning');
    dropdown.addEventListener(
      'transitionend',
      handleHeightTransition
    );

    function handleHeightTransition(e) {
      const isHeight = e.propertyName === 'height';

      if (!isHeight) {
        return;
      }

      dropdown.removeEventListener(
        'transitionend',
        handleHeightTransition
      );
      dropdown.classList.remove('is-transitioning');

      if (isDetailsActive) {
        dropdown.style.height = 'auto';

        return;
      }

      details.removeAttribute('open');
      btn.focus();
    }
  }

  setInitialAccessibilityAttr() {
    this.summaryElements.forEach(summaryElement => {
      const detailsElement = summaryElement.parentElement;
      const dropdown = summaryElement.nextElementSibling;
      const isDetailsOpen = detailsElement.hasAttribute('open');

      summaryElement.setAttribute('role', 'button');
      summaryElement.setAttribute('aria-controls', dropdown.id);
      summaryElement.setAttribute('aria-expanded', isDetailsOpen);
    });
  }
}

customElements.define('accordion-default', AccordionDefault);

const nav = document.querySelector('.js-nav');

nav?.addEventListener('click', function (e) {
  const isHoverDisabled = matchMedia('(hover: none)').matches;
  const isLink = e.target.classList.contains('js-nav-link');

  if (!isHoverDisabled || !isLink) {
    return;
  }

  const link = e.target;
  const linkItem = link.parentElement;
  const linksList = linkItem.parentElement;
  const activeLinkItem = linksList.querySelector(
    '.js-nav-item.is-active'
  );
  const hasDropdown = linkItem.classList.contains('has-dropdown');

  if (activeLinkItem !== linkItem) {
    activeLinkItem?.classList.remove('is-active');
  }

  if (!hasDropdown) {
    return;
  }

  e.preventDefault();

  linkItem.classList.toggle('is-active');
});

document.addEventListener('click', function (e) {
  const targetActiveLinkItem = e.target.closest(
    '.js-nav-item.is-active'
  );

  if (targetActiveLinkItem) {
    return;
  }

  const activeLinkItems = document.querySelectorAll(
    '.js-nav-item.is-active'
  );

  if (activeLinkItems.length == 0) {
    return;
  }

  activeLinkItems.forEach(activeLinkItem => {
    activeLinkItem.classList.remove('is-active');
  });
});

let navItems = document.querySelectorAll(
  '.js-nav-item.has-dropdown:not(.default-dropdown)'
);

window.addEventListener('shopify:section:load', function () {
  navItems = document.querySelectorAll(
    '.js-nav-item.has-dropdown:not(.default-dropdown)'
  );
});

['DOMContentLoaded', 'resize'].forEach(eventType => {
  window.addEventListener(eventType, () => {
    navItems = document.querySelectorAll(
      '.js-nav-item.has-dropdown:not(.default-dropdown)'
    );
    navItems.forEach(navItem => {
      const dropdown = navItem.querySelector('.js-dropdown');

      if (!dropdown) {
        return;
      }

      const { y, height } = navItem.getBoundingClientRect();
      const itemTop = y + height;
      const dropdownY = dropdown.getBoundingClientRect().y;
      const isSameOffset = itemTop === dropdownY;

      if (isSameOffset) {
        return;
      }

      const difference = Math.round(dropdownY - itemTop);

      navItem.style.setProperty('--after-height', `${difference}px`);
    });
  });
});

// Add is scrolled class for header when transparent and sticky are enabled

let hero =
  document.querySelector('.hero-banner') ||
  document.querySelector('main section');

window.addEventListener('shopify:section:load', function () {
  hero =
    document.querySelector('.hero-banner') ||
    document.querySelector('main section');
});

toggleHeaderIsScrolled();

windowDynamicEvents.forEach(eventType => {
  window.addEventListener(eventType, function () {
    toggleHeaderIsScrolled();
  });
});

function toggleHeaderIsScrolled() {
  if (!header || !hero) return;
  const isHeaderTransparent =
    header.classList.contains('is-transparent');
  const isHeaderSticky = header.classList.contains('is-sticky');

  if (!isHeaderTransparent || !isHeaderSticky) {
    return;
  }

  const { height, y } = hero.getBoundingClientRect();
  const isHeroInViewport = y + height - header.clientHeight > 0;

  isHeroInViewport
    ? header.classList.remove('is-scrolled')
    : header.classList.add('is-scrolled');
}

// Animations

const animationObserverOptions = {
  rootMargin: '-100px'
};

const animationObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      return;
    }

    entry.target.classList.add('animation-init');
    entry.target.addEventListener(
      'animationend',
      () => {
        entry.target.classList.add('animation-none');
      },
      {
        once: true
      }
    );
    animationObserver.unobserve(entry.target);
  });
}, animationObserverOptions);

observeAnimationElements();

window.addEventListener('shopify:section:load', () => {
  observeAnimationElements();
});

function observeAnimationElements() {
  const animationElements = document.querySelectorAll(
    '[class*="js-animation-"]'
  );

  animationElements.forEach(animationElement => {
    animationObserver.observe(animationElement);
  });
}

// DropdownInput

class DropdownInput extends HTMLElement {
  constructor() {
    super();
    this.select = this.querySelector('select');
    this.dropdown = null;
    this.buttons = null;
    this.detailsTemplate = this.querySelector(
      'template[data-name="details"]'
    );
    this.optionTemplate = this.querySelector(
      'template[data-name="option"]'
    );
    if (!this.select) return;
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.select.classList.add('hidden');
    this.appendTemplate();
  }

  appendTemplate() {
    const detailsTemplate =
      this.detailsTemplate.content.firstElementChild.cloneNode(true);
    const optionTemplate = this.optionTemplate.content;
    const options = Array.from(this.select.options);
    if (options.length === 0) return;
    const selectedOption = options.find(option => option.selected);
    // console.log(selectedOption);
    detailsTemplate.querySelector('[data-label]').textContent = selectedOption.label;
    options.forEach(option => {
      const html = optionTemplate.cloneNode(true);
      const button = html.querySelector('button');
      const li = html.querySelector('li');
      button.setAttribute('data-value', option.value);
      button.textContent = option.label;
      button.toggleAttribute('disabled', option.disabled);
      li.classList.toggle('is-active', option.selected);
      detailsTemplate.querySelector('[data-options]').append(html);
    });
    this.append(detailsTemplate);
    this.dropdown = this.querySelector('details');
    this.buttons = this.dropdown.querySelectorAll('button');
    this.setHandlers();
  }

  update() {
    this.dropdown = null;
    this.buttons = null;
    this.querySelector('details')?.remove();
    this.appendTemplate();
  }

  setHandlers() {
    this.querySelector('summary').addEventListener(
      'click',
      this.onSummaryClick.bind(this)
    );
    this.buttons.forEach((button, index) => {
      button.addEventListener('click', event =>
        this.onOptionSelect(event, index)
      );
    });
  }

  onOptionSelect(event, index) {
    event.preventDefault();
    Array.from(this.select.options).forEach(option =>
      option.removeAttribute('selected')
    );
    this.select.options[index].setAttribute('selected', 'selected');
    this.select.value = event.target.dataset.value;
    this.select.dispatchEvent(new Event('change', { bubbles: true }));
    this.querySelector('[data-label]').textContent =
      this.select.options[index].label;
    this.setSelectedOption(event.target);
  }

  setSelectedOption(buttonOption) {
    const buttonEl = buttonOption;
    this.buttons.forEach(button => {
      button.parentElement.classList.remove('is-active');
    });
    buttonEl.parentElement.classList.add('is-active');
    this.select.dispatchEvent(new Event('change'));
    this.select.closest('form')?.dispatchEvent(new Event('input'));
    this.close(
      undefined,
      this.dropdown.querySelector('summary'),
      this.dropdown
    );
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute('open');

    isOpen
      ? this.close(event, summaryElement, detailsElement)
      : this.open(summaryElement, detailsElement);
  }

  open(summaryElement, detailsElement) {
    setTimeout(() => {
      detailsElement.classList.add('is-open');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(detailsElement, summaryElement);
  }

  close(event, summaryElement, detailsElement) {
    if (event) {
      event.preventDefault();
    }

    detailsElement.classList.remove('is-open');
    removeTrapFocus(summaryElement);
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = time => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      elapsedTime < 300 // Increase for animation duration if necessary
        ? window.requestAnimationFrame(handleAnimation)
        : detailsElement.removeAttribute('open');
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('dropdown-input', DropdownInput);
