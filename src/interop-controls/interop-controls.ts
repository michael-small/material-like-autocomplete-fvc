import { JsonPipe } from '@angular/common';
import { Component, effect, inject, Service } from '@angular/core';
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
    email(p, { message: 'Must be an email' });
    required(p, { message: 'Field required' });
  });
}

@Service()
class MyFormService {
  public myForm = new FormGroup(new MyForm());
}

@Component({
  selector: 'app-interop-controls',
  template: `
    <form [formGroup]="myFormService.myForm">
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input
          matInput
          [formField]="myFormService.myForm.controls.name.fieldTree" />
        @for (
          error of myFormService.myForm.controls.name.fieldTree().errors();
          track error.kind
        ) {
          <mat-error>{{ error.message ?? error.kind }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Email</mat-label>
        <input
          matInput
          [formField]="myFormService.myForm.controls.email.fieldTree" />
        @for (
          error of myFormService.myForm.controls.email.fieldTree().errors();
          track error.kind
        ) {
          <mat-error>{{ error.message ?? error.kind }}</mat-error>
        }
      </mat-form-field>
    </form>

    <pre>{{ myFormService.myForm.getRawValue() | json }}</pre>
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
  protected myFormService = inject(MyFormService);

  constructor() {
    effect(() => {
      console.log(
        this.myFormService.myForm.controls.email.fieldTree().errors()
      );
    });
  }
}
