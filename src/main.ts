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
import { AutocompleteDisplayRoot } from './autocomplete-display/autocomplete-display';
import { InteropControls } from './interop-controls/interop-controls';

console.info('Angular CDK version', CDK_VERSION.full);
console.info('Angular Material version', MAT_VERSION.full);

@Component({
  selector: 'app-root',
  template: `
    <h1>Form Experimentation</h1>

    <p>
      <a href="https://youtu.be/qZiywIvbPEw?t=2063" target="_blank">
        As famously featured on "Let's Review Some Community Angular Code" by
        Jason Warner.</a
      >
    </p>

    <h2>
      Started out with this example, for a custom Material autocomplete for
      reactive/signal forms
    </h2>
    <app-autocomplete-display-root />

    <h2>
      Working on this on how to use signal form benefits in reactive forms
    </h2>
    <app-interop-controls />
  `,
  imports: [AutocompleteDisplayRoot, InteropControls],
})
class Root {}

bootstrapApplication(Root).catch(err => console.error(err));
