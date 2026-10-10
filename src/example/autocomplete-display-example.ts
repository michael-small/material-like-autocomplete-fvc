import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  Field,
  FormField,
  FormValueControl,
  required,
  transformedValue,
  validate,
  ValidationError,
  WithOptionalFieldTree,
} from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { form } from '@angular/forms/signals';

export type User = {
  name: string;
};

@Component({
  selector: 'app-root',
  template: `
    <button type="button" (click)="addOption()">Add Option</button>

    <pre>formControl value: {{ formControl.value | json }}</pre>
    <app-autocomplete-display-example
      [formControl]="formControl"
      [options]="options()"
      [valFnInput]="user => user.name" />

    <pre>formField().value(): {{ formField().value() | json }}</pre>
    <app-autocomplete-display-example
      [formField]="formField"
      [options]="options()"
      [valFnInput]="user => user.name" />
  `,
  styleUrl: 'autocomplete-display-example.css',
  imports: [
    forwardRef(() => AutocompleteDisplayExample),
    ReactiveFormsModule,
    JsonPipe,
    FormField,
  ],
})
export class Root {
  readonly #options = [{ name: 'Mary' }, { name: 'Shelley' }, { name: 'Igor' }];
  readonly options = signal(this.#options);

  protected formControl = new FormControl<User | null>(null, {
    validators: Validators.required,
  });
  protected formField = form(signal<User | null>(null), p => {
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

/**
 * @title Display value autocomplete
 */
@Component({
  selector: 'app-autocomplete-display-example',
  templateUrl: 'autocomplete-display-example.html',
  styleUrl: 'autocomplete-display-example.css',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    JsonPipe,
  ],
})
export class AutocompleteDisplayExample<
  T,
> implements FormValueControl<T | null> {
  public readonly errors = input<
    readonly WithOptionalFieldTree<ValidationError>[]
  >([]);
  public readonly invalid = input<boolean>(false);
  public readonly touched = input<boolean>(false);
  readonly touch = output<void>();

  readonly value = model<T | null>(null);
  readonly options = input.required<T[]>();

  public readonly valFnInput = input.required<(user: T) => string>();
  // public readonly displayFnInput = input.required<(user: T) => string>();

  protected valFn = computed(() => this.valFnInput());

  protected readonly rawValue = transformedValue(this.value, {
    parse: (name: string): { value: T | null } => ({
      value:
        this.options().find(option => this.valFn()(option) === name) ?? null,
    }),
    format: (user: T | null): string => (user ? this.valFn()(user) : ''),
  });

  protected readonly filteredOptions = computed<T[]>(() =>
    this._filter(this.rawValue())
  );

  protected selectOption(user: T): void {
    this.value.set(user);
  }

  private _filter(name: string): T[] {
    const filterValue = name.toLowerCase();

    const valFn = this.valFn();
    return this.options().filter(option =>
      valFn(option).toLowerCase().includes(filterValue)
    );
  }

  protected myErrors = computed<{ message: string; kind: string }[]>(() =>
    this.errors().map(err => ({ message: err.message ?? '', kind: err.kind }))
  );

  private readonly matInput = viewChild(MatInput);
  protected readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () =>
      (this.invalid() || this.errors().length > 0) && this.touched(),
    isSignalErrorState: (field: Field<unknown> | null) =>
      (this.invalid() ||
        this.errors().length > 0 ||
        (field?.().invalid() ?? false)) &&
      (this.touched() || (field?.().touched() ?? false)),
  };

  constructor() {
    effect(() => {
      this.invalid();
      this.errors();
      this.touched();
      this.matInput()?.updateErrorState();
    });
  }
}
