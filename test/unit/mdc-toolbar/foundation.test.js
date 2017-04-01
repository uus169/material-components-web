/**
 * Copyright 2016 Google Inc. All Rights Reserved.
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

import {assert} from 'chai';
import td from 'testdouble';

import {createMockRaf} from '../helpers/raf';
import {verifyDefaultAdapter} from '../helpers/foundation';
import {setupFoundationTest} from '../helpers/setup';
import MDCToolbarFoundation from '../../../packages/mdc-toolbar/foundation';

const {cssClasses, numbers} = MDCToolbarFoundation;

suite('MDCToolbarFoundation');

test('exports strings', () => {
  assert.isOk('strings' in MDCToolbarFoundation);
});

test('exports cssClasses', () => {
  assert.isOk('cssClasses' in MDCToolbarFoundation);
});

test('exports numbers', () => {
  assert.isOk('numbers' in MDCToolbarFoundation);
});

test('defaultAdapter returns a complete adapter implementation', () => {
  verifyDefaultAdapter(MDCToolbarFoundation, [
    'hasClass', 'addClass', 'removeClass', 'registerScrollHandler',
    'deregisterScrollHandler', 'registerResizeHandler', 'deregisterResizeHandler',
    'getViewportWidth', 'getViewportScrollY', 'getOffsetHeight',
    'getFlexibleRowElementOffsetHeight', 'notifyChange', 'setStyleForRootElement',
    'setStyleForTitleElement', 'setStyleForFlexibleRowElement',
    'setStyleForFixedAdjustElement',
  ]);
});

const setupTest = () => setupFoundationTest(MDCToolbarFoundation);

test('#constructor initialized keyHeights', () => {
  const {foundation} = setupTest();
  assert.isDefined(foundation.keyHeights);
});

test('#init calls component event registrations', () => {
  const {foundation, mockAdapter} = setupTest();

  foundation.init();
  td.verify(mockAdapter.registerResizeHandler(td.matchers.isA(Function)));
  td.verify(mockAdapter.registerResizeHandler(td.matchers.isA(Function)));
});

test('#destroy calls component event deregistrations', () => {
  const {foundation, mockAdapter} = setupTest();

  let resizeHandler;
  let scrollHandler;
  td.when(mockAdapter.registerResizeHandler(td.matchers.isA(Function))).thenDo((handler) => {
    resizeHandler = handler;
  });
  td.when(mockAdapter.registerScrollHandler(td.matchers.isA(Function))).thenDo((handler) => {
    scrollHandler = handler;
  });

  foundation.init();
  foundation.destroy();
  td.verify(mockAdapter.deregisterResizeHandler(resizeHandler));
  td.verify(mockAdapter.deregisterScrollHandler(scrollHandler));
});

test('#changeToolbarStyles debounces calls within the same frame', () => {
  const {foundation} = setupTest();
  const mockRaf = createMockRaf();
  foundation.changeToolbarStyles();
  foundation.changeToolbarStyles();
  foundation.changeToolbarStyles();
  assert.equal(mockRaf.pendingFrames.length, 1);
  mockRaf.restore();
});

test('#changeToolbarStyles resets debounce latch when changeToolbarStyles frame is run', () => {
  const {foundation} = setupTest();
  const mockRaf = createMockRaf();

  foundation.changeToolbarStyles();
  mockRaf.flush();
  foundation.changeToolbarStyles();
  assert.equal(mockRaf.pendingFrames.length, 1);
  mockRaf.restore();
});

test('#setKeyHeights sets the desktop row height and ratio correctly', () => {
  const {foundation, mockAdapter} = setupTest();
  const mockRaf = createMockRaf();
  const viewportWidth = 1024;
  const flexibleRowMaxHeight = numbers.TOOLBAR_ROW_HEIGHT * 4;
  const toolbarHeight = flexibleRowMaxHeight + numbers.TOOLBAR_ROW_HEIGHT;
  td.when(mockAdapter.getViewportWidth()).thenReturn(viewportWidth);
  td.when(mockAdapter.getFlexibleRowElementOffsetHeight()).thenReturn(flexibleRowMaxHeight);
  td.when(mockAdapter.getOffsetHeight()).thenReturn(toolbarHeight);
  foundation.init();

  foundation.setKeyHeights();
  mockRaf.flush();

  assert.equal(foundation.keyHeights.toolbarRowHeight, numbers.TOOLBAR_ROW_HEIGHT);
  assert.equal(foundation.keyHeights.toolbarRatio, 5);
  assert.equal(foundation.keyHeights.flexibleExpansionRatio, 3);
  assert.equal(foundation.keyHeights.maxTranslateYRatio, 0);
  assert.equal(foundation.keyHeights.scrollThesholdRatio, 3);
  mockRaf.restore();
});

test('#setKeyHeights sets the mobile row height and ratio correctly', () => {
  const {foundation, mockAdapter} = setupTest();
  const mockRaf = createMockRaf();
  const viewportWidth = 360;
  const flexibleRowMaxHeight = numbers.TOOLBAR_ROW_MOBILE_HEIGHT * 4;
  const toolbarHeight = flexibleRowMaxHeight + numbers.TOOLBAR_ROW_MOBILE_HEIGHT;
  td.when(mockAdapter.getViewportWidth()).thenReturn(viewportWidth);
  td.when(mockAdapter.getFlexibleRowElementOffsetHeight()).thenReturn(flexibleRowMaxHeight);
  td.when(mockAdapter.getOffsetHeight()).thenReturn(toolbarHeight);
  foundation.init();

  foundation.setKeyHeights();
  mockRaf.flush();

  assert.equal(foundation.keyHeights.toolbarRowHeight, numbers.TOOLBAR_ROW_MOBILE_HEIGHT);
  assert.equal(foundation.keyHeights.toolbarRatio, 5);
  assert.equal(foundation.keyHeights.flexibleExpansionRatio, 3);
  assert.equal(foundation.keyHeights.maxTranslateYRatio, 0);
  assert.equal(foundation.keyHeights.scrollThesholdRatio, 3);
  mockRaf.restore();
});

test('#setKeyHeights debounces calls within the same frame', () => {
  const {foundation} = setupTest();
  const mockRaf = createMockRaf();
  foundation.setKeyHeights();
  foundation.setKeyHeights();
  foundation.setKeyHeights();
  assert.equal(mockRaf.pendingFrames.length, 1);
  mockRaf.restore();
});

test('#setKeyHeights resets debounce latch when setKeyHeights frame is run', () => {
  const {foundation} = setupTest();
  const mockRaf = createMockRaf();

  foundation.setKeyHeights();
  // Calling mockRaf twice because #setKeyHeights also calls changeToolbarStyles
  mockRaf.flush();
  mockRaf.flush();
  foundation.setKeyHeights();
  assert.equal(mockRaf.pendingFrames.length, 1);
  mockRaf.restore();
});

test('#scrolledOutOfTheshold_ sets return true only if the last change has been executed', () => {
  const {foundation} = setupTest();
  const scrollTop = 40;

  foundation.init();
  foundation.keyHeights.scrollTheshold = 30;

  // The first time scrolledOutOfTheshold_ should return false and execute the last change
  assert.isFalse(foundation.scrolledOutOfTheshold_(scrollTop));
  // The second time scrolledOutOfTheshold_ should return true
  assert.isTrue(foundation.scrolledOutOfTheshold_(scrollTop));
});


test('#calculateFlexibleExpansionRatio_ returns zero when scrollTop equals to flexibleExpansionHeight', () => {
  const {foundation} = setupTest();
  const scrollTop = 40;

  foundation.init();
  foundation.keyHeights.flexibleExpansionHeight = 40;

  assert.approximately(foundation.calculateFlexibleExpansionRatio_(scrollTop), 0, 0.0001);
});

test('#calculateFlexibleExpansionRatio_ returns 0.5 when scrollTop equals to flexibleExpansionHeight', () => {
  const {foundation} = setupTest();
  const scrollTop = 20;

  foundation.init();
  foundation.keyHeights.flexibleExpansionHeight = 40;

  assert.approximately(foundation.calculateFlexibleExpansionRatio_(scrollTop), 0.5, 0.0001);
});

test('#calculateFlexibleExpansionRatio_ returns 1 when scrollTop equals to 0', () => {
  const {foundation} = setupTest();
  const scrollTop = 0;

  foundation.init();
  foundation.keyHeights.flexibleExpansionHeight = 40;

  assert.approximately(foundation.calculateFlexibleExpansionRatio_(scrollTop), 1, 0.0001);
});

test('#calculateFlexibleExpansionRatio_ handles no flexible height case', () => {
  const {foundation} = setupTest();
  const scrollTop = 20;

  foundation.init();
  foundation.keyHeights.flexibleExpansionHeight = 0;

  assert.equal(foundation.calculateFlexibleExpansionRatio_(scrollTop), 0);
});

test('#changeToolbarFlexibleState_ assign min class to root when shrinked', () => {
  const {foundation, mockAdapter} = setupTest();
  const shrinked = 0;

  foundation.changeToolbarFlexibleState_(shrinked);
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
});

test('#changeToolbarFlexibleState_ assign max class to root when expanded', () => {
  const {foundation, mockAdapter} = setupTest();
  const expanded = 1;

  foundation.changeToolbarFlexibleState_(expanded);
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN), {times: 0});
});

test('#changeToolbarFlexibleState_ assign no class to root in transition', () => {
  const {foundation, mockAdapter} = setupTest();
  const inTransition = 0.5;

  foundation.changeToolbarFlexibleState_(inTransition);
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MAX));
  td.verify(mockAdapter.removeClass(cssClasses.FLEXIBLE_MIN));
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MAX), {times: 0});
  td.verify(mockAdapter.addClass(cssClasses.FLEXIBLE_MIN), {times: 0});
});

test('#changeToolbarFixedState_ transform toolbar upward correctly', () => {
  const {foundation, mockAdapter} = setupTest();
  const scrollTop = 40;
  const expectedTrans = 'translateY(-20px)';

  foundation.keyHeights.flexibleExpansionHeight = 20;
  foundation.keyHeights.maxTranslateYDistance = 30;

  foundation.changeToolbarFixedState_(scrollTop);
  td.verify(mockAdapter.setStyleForRootElement('transform', expectedTrans));
  td.verify(mockAdapter.removeClass(cssClasses.FIXED_AT_LAST_ROW));
  td.verify(mockAdapter.addClass(cssClasses.FIXED_AT_LAST_ROW), {times: 0});
});

test('#changeToolbarFixedState_ transform toolbar is capped by maxTranslateYDistance', () => {
  const {foundation, mockAdapter} = setupTest();
  const scrollTop = 40;
  const expectedTrans = 'translateY(-10px)';

  foundation.keyHeights.flexibleExpansionHeight = 20;
  foundation.keyHeights.maxTranslateYDistance = 10;

  foundation.changeToolbarFixedState_(scrollTop);
  td.verify(mockAdapter.setStyleForRootElement('transform', expectedTrans));
  td.verify(mockAdapter.addClass(cssClasses.FIXED_AT_LAST_ROW));
  td.verify(mockAdapter.removeClass(cssClasses.FIXED_AT_LAST_ROW), {times: 0});
});

test('#changeToolbarFixedState_ does not transform toolbar when scrollTop < flexibleExpansionHeight', () => {
  const {foundation, mockAdapter} = setupTest();
  const scrollTop = 10;
  const expectedTrans = 'translateY(0px)';

  foundation.keyHeights.flexibleExpansionHeight = 20;
  foundation.keyHeights.maxTranslateYDistance = 10;

  foundation.changeToolbarFixedState_(scrollTop);
  td.verify(mockAdapter.setStyleForRootElement('transform', expectedTrans));
  td.verify(mockAdapter.removeClass(cssClasses.FIXED_AT_LAST_ROW));
  td.verify(mockAdapter.addClass(cssClasses.FIXED_AT_LAST_ROW), {times: 0});
});

test('#changeFlexibleRowElementStyles_ sets the height of flexible row correctly', () => {
  const {foundation, mockAdapter} = setupTest();
  const toolbarRowHeight = 64;
  const flexibleExpansionHeight = toolbarRowHeight * 2;
  const flexibleExpansionRatio = 1;

  foundation.fixedAllRow_ = true;
  foundation.keyHeights.toolbarRowHeight = toolbarRowHeight;
  foundation.keyHeights.flexibleExpansionHeight = flexibleExpansionHeight;

  foundation.changeFlexibleRowElementStyles_(flexibleExpansionRatio);
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', `${flexibleExpansionHeight + toolbarRowHeight}px`));
});

test('#changeFlexibleRowElementStyles_ sets the default changes as well', () => {
  const {foundation, mockAdapter} = setupTest();
  const toolbarRowHeight = 64;
  const flexibleExpansionHeight = toolbarRowHeight * 2;
  const flexibleExpansionRatio = 1;
  const currentTitleSize = 2.125;

  foundation.fixedAllRow_ = true;
  foundation.useFlexDefaultBehavior_ = true;
  foundation.keyHeights.toolbarRowHeight = toolbarRowHeight;
  foundation.keyHeights.flexibleExpansionHeight = flexibleExpansionHeight;

  foundation.changeFlexibleRowElementStyles_(flexibleExpansionRatio);
  td.verify(mockAdapter.setStyleForFlexibleRowElement('height', `${flexibleExpansionHeight + toolbarRowHeight}px`));
  td.verify(mockAdapter.setStyleForTitleElement('transform', `translateY(${flexibleExpansionHeight}px)`));
  td.verify(mockAdapter.setStyleForTitleElement('fontSize', `${currentTitleSize}rem`));
});
