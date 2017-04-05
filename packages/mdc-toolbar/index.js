/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {MDCComponent} from '@material/base';

import MDCToolbarFoundation from './foundation';

export {MDCToolbarFoundation};

export class MDCToolbar extends MDCComponent {
  static attachTo(root) {
    return new MDCToolbar(root);
  }

  get flexibleRowElement_() {
    return this.root_.querySelector(MDCToolbarFoundation.strings.FLEXIBLE_ROW_SELECTOR);
  }

  get titleElement_() {
    return this.root_.querySelector(MDCToolbarFoundation.strings.TITLE_SELECTOR);
  }

  set fixedAdjustElement(fixedAdjustElement) {
    this.fixedAdjustElement_ = fixedAdjustElement;
  }

  get fixedAdjustElement() {
    return this.fixedAdjustElement_;
  }

  getDefaultFoundation() {
    return new MDCToolbarFoundation({
      hasClass: (className) => this.root_.classList.contains(className),
      addClass: (className) => this.root_.classList.add(className),
      removeClass: (className) => this.root_.classList.remove(className),
      registerScrollHandler: (handler) => window.addEventListener('scroll', handler),
      deregisterScrollHandler: (handler) => window.removeEventListener('scroll', handler),
      registerResizeHandler: (handler) => window.addEventListener('resize', handler),
      deregisterResizeHandler: (handler) => window.removeEventListener('resize', handler),
      getViewportWidth: () => window.innerWidth,
      getViewportScrollY: () => window.scrollY,
      getOffsetHeight: () => this.root_.offsetHeight,
      getFlexibleRowElementOffsetHeight: () => this.flexibleRowElement_.offsetHeight,
      notifyChange: (flexibleExpansionRatio) => this.emit('MDCToolbar:change', flexibleExpansionRatio),
      setStyleForRootElement: (property, value) => this.root_.style[property] = value,
      setStyleForTitleElement: (property, value) => this.titleElement_.style[property] = value,
      setStyleForFlexibleRowElement: (property, value) => this.flexibleRowElement_.style[property] = value,
      setStyleForFixedAdjustElement: (property, value) => {
        if (this.fixedAdjustElement) {
          this.fixedAdjustElement.style[property] = value;
        }
      },
    });
  }
}
