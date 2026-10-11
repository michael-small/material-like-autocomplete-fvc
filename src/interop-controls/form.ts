import { effect, inject, Service, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { map, timer } from 'rxjs';
import { allEventsSignal } from './form-events';
import { SigFCsToRegularFCs, SignalFormValueOf } from './type-utils';
import { disabled, email, required } from '@angular/forms/signals';
import { SignalFormControl } from '@angular/forms/signals/compat';

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
export class ProfileFormService {
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
