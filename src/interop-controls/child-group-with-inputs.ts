import { Component, effect, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { type ProfileForm } from './form';
import { FormField } from '@angular/forms/signals';
import { EmailField } from './child-with-input';

@Component({
  selector: 'app-child-group-with-inputs',
  template: `
    @let profileForm = group();
    <form [formGroup]="profileForm">
      @let controls = profileForm.controls;

      <!-- Hardcoded field in this parent component -->
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput [formField]="controls.name.fieldTree" />
        @for (error of controls.name.fieldTree().errors(); track error.kind) {
          <mat-error>{{
            error.message ?? 'Error of type: ' + error.kind
          }}</mat-error>
        }
      </mat-form-field>
      @if (controls.name.fieldTree().disabled()) {
        @for (
          reason of controls.name.fieldTree().disabledReasons();
          track reason
        ) {
          <span>{{ reason.message }}</span>
        }
      }

      <!-- The field is properly reactive from the input :0 
       (toSignal of reactive form fields didn't work) -->
      <app-email-field [emailField]="controls.email.fieldTree" />
    </form>
  `,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormField,
    EmailField,
  ],
})
export class ChildGroupWithInputs {
  public readonly group = input.required<FormGroup<ProfileForm>>();

  constructor() {
    effect(() => {
      const name = this.group().controls.name.fieldTree();
      const email = this.group().controls.email.fieldTree();

      console.log(
        `form fields: name ${name.value()}(valid: ${name.valid()}) and email ${email.value()} (valid: ${email.valid()})`
      );
    });
  }
}
