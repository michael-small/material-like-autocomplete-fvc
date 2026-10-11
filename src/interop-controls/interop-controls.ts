import { JsonPipe } from '@angular/common';
import { Component, inject, Service } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { email, FormField, required } from '@angular/forms/signals';
import { SignalFormControl } from '@angular/forms/signals/compat';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/**
 * @description Converts a form control / form group to its underlying value's type
 * @link https://blog.flensrocker.de/angular/utils/forms/2024/09/18/angular-utils-form-value-of.html
 */
export type FormValueOf<T extends AbstractControl> =
  T extends FormControl<infer TControl>
    ? TControl
    : T extends FormGroup<infer TGroup>
      ? { [K in keyof TGroup]: SignalFormValueOf<TGroup[K]> }
      : T extends FormArray<infer TElement>
        ? SignalFormValueOf<TElement>[]
        : T;

/**
 * @description `FormValueOf` but for `SignalFormControl` typing
 */
export type SignalFormValueOf<T extends AbstractControl> =
  T extends SignalFormControl<infer TControl>
    ? TControl
    : T extends FormGroup<infer TGroup>
      ? { [K in keyof TGroup]: SignalFormValueOf<TGroup[K]> }
      : T extends FormArray<infer TElement>
        ? SignalFormValueOf<TElement>[]
        : T;

// Converts the raw value of a form back to individual regular old form controls
// Intermediate for the next type
type FormControlsOf<T extends object> = {
  [K in keyof T]: FormControl<T[K]>;
};

/**
 * @description Launders the typing of a SignalFormControl grouping to regular FormControl grouping
 */
type SigFCsToRegularFCs<T extends { [K in keyof T]: AbstractControl }> =
  FormControlsOf<SignalFormValueOf<FormGroup<T>>>;

/**
 * {
    readonly name: string;
    readonly email: string;
   } 
 */
type MyFormValue = SignalFormValueOf<FormGroup<MyForm>>;
class MyForm {
  public readonly name = new SignalFormControl('', p => {
    required(p, { message: 'Field required' });
  });
  public readonly email = new SignalFormControl('', p => {
    required(p, { message: 'Field required' });
    email(p, {
      when: () => {
        const nameValue = this.name.fieldTree().value();
        return nameValue === 'John Email';
      },
      message: 'Must be an email',
    });
  });

  constructor(value?: { name: string; email: string }) {
    this.name.setValue(value?.name);
    this.email.setValue(value?.email);
  }
}

@Service()
class MyFormService {
  readonly #fb = inject(NonNullableFormBuilder);
  public myForm = new FormGroup(new MyForm());

  public initializeForm(value: MyFormValue) {
    const tempForm = this.#fb.group<SigFCsToRegularFCs<MyForm>>({
      name: this.#fb.control(value.name),
      email: this.#fb.control(value.email),
    });

    this.myForm.setValue(tempForm.getRawValue());
  }
}

@Component({
  selector: 'app-interop-controls',
  template: `
    <form [formGroup]="myForm">
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput [formField]="myForm.controls.name.fieldTree" />
        @for (
          error of myForm.controls.name.fieldTree().errors();
          track error.kind
        ) {
          <mat-error>{{ error.message ?? error.kind }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput [formField]="myForm.controls.email.fieldTree" />
        @for (
          error of myForm.controls.email.fieldTree().errors();
          track error.kind
        ) {
          <mat-error>{{ error.message ?? error.kind }}</mat-error>
        }
      </mat-form-field>
    </form>

    <pre>{{ myForm.getRawValue() | json }}</pre>
  `,
  imports: [
    MatFormField,
    MatError,
    MatInputModule,
    FormField,
    JsonPipe,
    ReactiveFormsModule,
  ],
})
export class InteropControls {
  readonly #myFormService = inject(MyFormService);
  protected myForm = this.#myFormService.myForm;

  constructor() {
    this.#myFormService.initializeForm({ email: 'Test', name: 'John Email' });
  }
}
