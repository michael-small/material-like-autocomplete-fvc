import { JsonPipe } from '@angular/common';
import { Component, inject, Service } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { email, FormField, required } from '@angular/forms/signals';
import { SignalFormControl } from '@angular/forms/signals/compat';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

class MyForm {
  name = new SignalFormControl('', p => {
    required(p, { message: 'Field required' });
  });
  email = new SignalFormControl('', p => {
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
  public myForm = new FormGroup(new MyForm());

  public initializeForm() {
    const tempForm = new FormGroup(
      new MyForm({ email: '', name: 'John Email' })
    );
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
    this.#myFormService.initializeForm();
  }
}
