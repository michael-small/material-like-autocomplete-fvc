import { Component, signal } from '@angular/core';
import { FormField, required, validate } from '@angular/forms/signals';
import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { form } from '@angular/forms/signals';
import { InteropControls } from '../interop-controls/interop-controls';
import { AutocompleteDisplayField } from './autocomplete-display-field';

export type UserAutocomplete = {
  name: string;
};

@Component({
  selector: 'app-autocomplete-display-root',
  template: `
    <app-interop-controls />

    <button type="button" (click)="addOption()">Add Option</button>

    <pre>formControl value: {{ formControl.value | json }}</pre>
    <app-autocomplete-display-field
      [formControl]="formControl"
      [options]="options()"
      [valFnInput]="user => user.name" />

    <pre>formField().value(): {{ formField().value() | json }}</pre>
    <app-autocomplete-display-field
      [formField]="formField"
      [options]="options()"
      [valFnInput]="user => user.name" />
  `,
  imports: [
    AutocompleteDisplayField,
    ReactiveFormsModule,
    JsonPipe,
    FormField,
    InteropControls,
  ],
})
export class AutocompleteDisplayRoot {
  readonly #options = [{ name: 'Mary' }, { name: 'Shelley' }, { name: 'Igor' }];
  readonly options = signal(this.#options);

  protected formControl = new FormControl<UserAutocomplete | null>(null, {
    validators: Validators.required,
  });
  protected formField = form(signal<UserAutocomplete | null>(null), p => {
    required(p, { message: 'Field is required' });
    validate(p, ({ valueOf }) => {
      const value = valueOf(p);
      if (value?.name !== 'Mary') {
        return {
          message: 'Name must be Mary',
          kind: 'invalidName',
        };
      } else {
        return;
      }
    });
  });

  protected addOption() {
    this.options.update(o => [...o, { name: 'Doug' }]);
  }
}
