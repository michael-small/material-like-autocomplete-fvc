import { JsonPipe } from '@angular/common';
import {
  Component,
  effect,
  inject,
  Service,
  signal,
  Signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { disabled, email, FormField, required } from '@angular/forms/signals';
import { SignalFormControl } from '@angular/forms/signals/compat';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// https://ngxtension.dev/utilities/forms/form-events/
// Copy the source code (self contained one file with no non-Angular 1st party improts)
import { allEventsSignal } from './form-events';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith, timer } from 'rxjs';

/**
 * @description Converts a form control / form group to its underlying value's type
 * @link https://angular.dev/guide/forms/signals/migration#binding-signalformcontrol
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
 * @link https://angular.dev/guide/forms/signals/migration#binding-signalformcontrol
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
type ProfileFormValue = SignalFormValueOf<FormGroup<ProfileForm>>;

/**
 * @description I used to do this pattern but with `new FormControl` etc. Now I can:
 * - Declarative cross form field validation with typing
 * - Declarative rules like `disabled`
 * - Messages for errors
 * - Drop in signal form schemas
 *
 * BUT, there is one typing bummer, but it is mitigated by these mapped types IMO
 * See the bottom of this file where I breakdown types
 *
 * BUT GREAT NEWS! Use my ngxtension util `allEventsSignal` and you can have all the form group
 * state as signals! And just reference that for proper typing.
 */
class ProfileForm {
  #extData = signal({ loading: false });

  public readonly name = new SignalFormControl('', p => {
    required(p, { message: 'Field required' });
    disabled(p, {
      when: () => this.#extData().loading,
    });
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
    disabled(p, {
      when: () => this.#extData().loading,
    });
  });

  constructor(
    value: { name: string; email: string },
    externalData: Signal<boolean>
  ) {
    this.name.setValue(value?.name);
    this.email.setValue(value?.email);

    effect(() => this.#extData.set({ loading: externalData() }), {
      debugName: 'set external data',
    });
  }
}

@Service()
class ProfileFormService {
  readonly #fb = inject(NonNullableFormBuilder);

  // Fake 2 second load for form fields to be disabled
  public loading = toSignal(timer(2000).pipe(map(() => false)), {
    initialValue: true,
  });

  public profileForm = new FormGroup(
    new ProfileForm({ name: '', email: '' }, this.loading)
  );

  // https://ngxtension.dev/utilities/forms/form-events/
  // Copy the source code (self contained one file with no non-Angular 1st party improts)
  public profileFormData = allEventsSignal<ProfileFormValue>(this.profileForm);

  public initializeForm(value: ProfileFormValue) {
    const tempForm = this.#fb.group<SigFCsToRegularFCs<ProfileForm>>({
      name: this.#fb.control(value.name),
      email: this.#fb.control(value.email),
    });

    this.profileForm.setValue(tempForm.getRawValue());
  }
}

@Component({
  selector: 'app-interop-controls',
  template: `
    <form [formGroup]="profileForm">
      @let controls = profileForm.controls;
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput [formField]="controls.name.fieldTree" />
        @for (error of controls.name.fieldTree().errors(); track error.kind) {
          <mat-error>{{
            error.message ?? 'Error of type: ' + error.kind
          }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput [formField]="controls.email.fieldTree" />
        @for (error of controls.email.fieldTree().errors(); track error.kind) {
          <mat-error>{{
            error.message ?? 'Error of type: ' + error.kind
          }}</mat-error>
        }
      </mat-form-field>
    </form>

    <pre>Form raw value: {{ profileForm.getRawValue() | json }}</pre>
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
  readonly #profileFormService = inject(ProfileFormService);
  protected profileForm = this.#profileFormService.profileForm;

  constructor() {
    this.#profileFormService.initializeForm({
      email: 'Test',
      name: 'John Email',
    });

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

    effect(() => {
      console.log(formValueFromUtil());
    });
  }
}
