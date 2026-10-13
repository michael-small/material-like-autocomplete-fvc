/* eslint-disable @typescript-eslint/no-unused-vars */
import { JsonPipe } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ProfileFormService } from './form';
import { ChildGroupWithInputs } from './child-group-with-inputs';

@Component({
  selector: 'app-interop-controls',
  template: `
    <p>
      In this example, the form is hardcoded to have an email validator if your
      name is John Email.
    </p>

    <app-child-group-with-inputs [group]="profileForm" />

    <!-- Banned by linnting this too -->
    <pre>
BANNED profileForm.getRawValue(): {{ profileForm.getRawValue() | json }}
    </pre>

    <!-- Ban this as well by linnting  -->
    <pre>BANNED profileForm.value: {{ profileForm.value | json }}</pre>

    <!-- Allow this by linnting -->
    <pre>
ALLOWED profileFormData().value (util): {{
        profileFormData().value | json
      }}</pre>
    <!-- Allow this by linnting -->
    <pre>
ALLOWED profileForm.controls.email.fieldTree().value() {{
        profileForm.controls.email.fieldTree().value()
      }}</pre>

    <p>
      See the "lintingExample()" private function for in-editor examples of more
      good and bad linting type examples.
    </p>
  `,
  imports: [
    MatInputModule,
    JsonPipe,
    ReactiveFormsModule,
    ChildGroupWithInputs,
  ],
})
export class InteropControls {
  readonly #profileFormService = inject(ProfileFormService);
  protected profileForm = this.#profileFormService.profileForm;
  protected profileFormData = this.#profileFormService.profileFormData;

  constructor() {
    this.#profileFormService.initializeForm({
      email: 'Test',
      name: 'John Email',
    });

    this.lintingExample();
  }

  /**
   * @description See in editor how linting helps enforce proper typing using my utils
   */
  private lintingExample() {
    console.warn(
      'Check out my component for how linting covers the type issue!'
    );

    // Regular reactive forms have no problem with linting
    const fc = new FormControl<string>('');
    const a = fc.value;
    const b = fc.getRawValue();

    // Banned these following four with linting
    const banThis = this.profileForm.value;
    const banThisToo = this.profileForm.getRawValue();
    const alsoBanThis = this.profileForm.controls.email.value;
    const alsoBanThisToo = this.profileForm.controls.email.getRawValue();

    // But allowed these
    const thisIsValid = this.profileForm.controls.email.fieldTree().value;
    const alsoThisIsValid = this.profileFormData().value;

    // `fieldTree` of each control is properly typed
    // `WritableSignal<string>`
    const valueFieldTree = this.profileForm.controls.email.fieldTree().value;

    // HOWEVER, the entire group has the field names and shape consistent, but `any` values
    // This is a restriction for `SignalFormControl` when you can't read the `fieldTree` directly.
    // https://angular.dev/guide/forms/signals/migration#binding-signalformcontrol
    /**
       * {
            readonly name: any;
            readonly email: any;
          }
       */
    const valueValue = this.profileForm.getRawValue(); // Also for `.value`

    // HOWEVER HOWEVER with the form type utils and consistency, this is still way better for functionality
    // if you are consistent with types IMO, but risk `any` for form controls if you do not
    // apply the mapped form types
    /**
       * {
            readonly name: string;
            readonly email: string;
         }
       */
    const valueMapped: {
      readonly name: string;
      readonly email: string;
    } = this.profileForm.getRawValue();

    // Typed!!! And throws in other form data that can be reacted to downstream of the main signal
    const formValueFromUtil = this.#profileFormService.profileFormData; // need to still invoke this + `().value`
  }
}
