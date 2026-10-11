/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { VERSION as CDK_VERSION } from '@angular/cdk';
import { VERSION as MAT_VERSION } from '@angular/material/core';
import { Component } from '@angular/core';
import { AutocompleteDisplayRoot } from './example/autocomplete-display-example';

console.info('Angular CDK version', CDK_VERSION.full);
console.info('Angular Material version', MAT_VERSION.full);

@Component({
  selector: 'app-root',
  template: ` <app-autocomplete-display-root /> `,
  imports: [AutocompleteDisplayRoot],
})
class Root {}

bootstrapApplication(Root).catch(err => console.error(err));
