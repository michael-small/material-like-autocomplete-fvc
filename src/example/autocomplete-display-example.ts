import {
  Component,
  computed,
  effect,
  forwardRef,
  input,
  model,
  signal,
} from "@angular/core";
import {
  FormField,
  FormValueControl,
  required,
  transformedValue,
  ValidationError,
  WithOptionalFieldTree,
} from "@angular/forms/signals";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { JsonPipe } from "@angular/common";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { form } from "@angular/forms/signals";

export interface User {
  name: string;
}

@Component({
  selector: "root",
  template: `
    <button type="button" (click)="addOption()">Add Option</button>

    <pre>formControl value: {{ formControl.value | json }}</pre>
    <autocomplete-display-example
      [formControl]="formControl"
      [options]="options()"
      [valFnInput]="user => user.name"
    />

    <pre>formField().value(): {{ formField().value() | json }}</pre>
    <autocomplete-display-example
      [formField]="formField"
      [options]="options()"
      [valFnInput]="user => user.name"
    />
  `,
  styleUrl: "autocomplete-display-example.css",
  imports: [
    forwardRef(() => AutocompleteDisplayExample),
    ReactiveFormsModule,
    JsonPipe,
    FormField,
  ],
})
export class Root {
  readonly #options = [{ name: "Mary" }, { name: "Shelley" }, { name: "Igor" }];
  readonly options = signal(this.#options);

  protected formControl = new FormControl<User | null>(null, {
    validators: Validators.required,
  });
  protected formField = form(signal<User | null>(null), (p) => {
    required(p, { message: "test" });
  });

  protected addOption() {
    this.options.update((o) => [...o, { name: "Doug" }]);
  }

  constructor() {
    effect(
      () => {
        console.log(this.options());
      },
      { debugName: "options effect" },
    );
  }
}

/**
 * @title Display value autocomplete
 */
@Component({
  selector: "autocomplete-display-example",
  templateUrl: "autocomplete-display-example.html",
  styleUrl: "autocomplete-display-example.css",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    JsonPipe,
  ],
})
export class AutocompleteDisplayExample<
  T extends any,
> implements FormValueControl<T | null> {
  public readonly errors = input<
    readonly WithOptionalFieldTree<ValidationError>[]
  >([]);
  public readonly invalid = input<boolean>(false);

  readonly value = model<T | null>(null);
  readonly options = input.required<T[]>();

  public readonly valFnInput = input.required<(user: T) => string>();
  // public readonly displayFnInput = input.required<(user: T) => string>();

  protected valFn = computed(() => this.valFnInput());

  protected readonly rawValue = transformedValue(this.value, {
    parse: (name: string): { value: T | null } => ({
      value:
        this.options().find((option) => this.valFn()(option) === name) ?? null,
    }),
    format: (user: T | null): string => (user ? this.valFn()(user) : ""),
  });

  protected readonly filteredOptions = computed<T[]>(() =>
    this._filter(this.rawValue()),
  );

  protected selectOption(user: T): void {
    this.value.set(user);
  }

  private _filter(name: string): T[] {
    const filterValue = name.toLowerCase();

    const valFn = this.valFn();
    return this.options().filter((option) =>
      valFn(option).toLowerCase().includes(filterValue),
    );
  }
}
