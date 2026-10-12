import { Component, computed, effect, input } from '@angular/core';
import { FieldTree, FormField, ValidationError } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-email-field',
  template: `
    @let emailField = this.emailField();
    <mat-form-field>
      <mat-label>Email</mat-label>
      <input matInput [formField]="emailField" />
      @for (error of errors(); track error.kind) {
        <mat-error>{{
          error.message ?? 'Error of type: ' + error.kind
        }}</mat-error>
      }
    </mat-form-field>
  `,
  imports: [FormField, MatFormFieldModule, MatInputModule],
})
export class EmailField {
  // These are reactive as inputs, as compared to form controls which are not
  // for toSignal!!!
  public readonly emailField = input.required<FieldTree<string>>();

  protected errors = computed<ValidationError.WithFieldTree[]>(() =>
    this.emailField()().errors()
  );

  constructor() {
    effect(
      () => {
        console.log(this.emailField()().value());
      },
      { debugName: 'log value of email field' }
    );
  }
}
