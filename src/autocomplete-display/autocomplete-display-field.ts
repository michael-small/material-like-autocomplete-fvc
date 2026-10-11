import { JsonPipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import {
  Field,
  FormValueControl,
  transformedValue,
  ValidationError,
  WithOptionalFieldTree,
} from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-autocomplete-display-field',
  templateUrl: 'autocomplete-display-field.html',
  styleUrl: 'autocomplete-display-field.css',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    JsonPipe,
  ],
})
export class AutocompleteDisplayField<T> implements FormValueControl<T | null> {
  readonly options = input.required<T[]>();

  // Standard `FormValueControl` (FVC) fields. Only `value` is required.
  // https://angular.dev/guide/forms/signals/custom-controls
  readonly value = model<T | null>(null);
  public readonly errors = input<
    readonly WithOptionalFieldTree<ValidationError>[]
  >([]);
  public readonly invalid = input<boolean>(false);
  public readonly touched = input<boolean>(false);
  readonly touch = output<void>();

  // FormValueControl helper (but usable without one) for
  // handling the component's form value vs FVC value
  protected readonly rawValue = transformedValue(this.value, {
    //Parse the raw value into the model value.
    //Should return an object containing the parsed result, which may contain:
    // - value: The parsed model value. If undefined, the model will not be updated.
    //- error: Any parse errors encountered. If undefined, no errors are reported.
    parse: (name: string): { value: T | null } => ({
      value:
        this.options().find(option => this.valueFn()(option) === name) ?? null,
    }),
    // Format the model value into the raw value.
    format: (option: T | null): string =>
      option ? this.valueFn()(option) : '',
  });

  public readonly valFnInput = input.required<(option: T) => string>();
  // TODO - handle displayFn difference
  // public readonly displayFnInput = input.required<(option:T) => string>();

  protected readonly valueFn = computed<(option: T) => string>(() =>
    this.valFnInput()
  );
  protected readonly displayWithFn = (option: T | null): string =>
    option ? this.valueFn()(option) : '';

  protected readonly filteredOptions = computed<T[]>(() =>
    this.filterOptions(this.rawValue())
  );

  protected selectOption(option: T): void {
    this.value.set(option);
  }

  private filterOptions(name: string): T[] {
    const filterValue = name.toLowerCase();

    const valFn = this.valueFn();
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
      // Using Material controls in a child FVC needs the error state
      // to be fired automatically when any of those
      // above signals change
      this.matInput()?.updateErrorState();
    });
  }
}
