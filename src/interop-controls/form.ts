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
      when: () => (this.#extData().loading ? 'Loading...' : false),
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

  // Form builder didn't seem to work making this group exactly like this, but
  // the controls themselves are non-nullable
  public profileForm = new FormGroup(
    new ProfileForm({ name: '', email: '' }, this.loading)
  );

  // https://ngxtension.dev/utilities/forms/form-events/
  public profileFormData = allEventsSignal<ProfileFormValue>(this.profileForm);

  public initializeForm(value: ProfileFormValue) {
    // NEVER re-assign a reactive form control/group/array
    // That causes all sorts of issues, including losing reactivity at classfield time
    // Hence one of the same shape is made so it can be patched into the real form
    //
    // You could just pass the raw values in the `setValue`,
    // but for the projects I work on, we use `new SomeGroup(...)`
    // with data we GET and the constructor sets the data internally. So doing a seperate group and then
    // setting the value of the form service class to this temp class is consistent for us.
    const tempForm = this.#fb.group<SigFCsToRegularFCs<ProfileForm>>({
      name: this.#fb.control(value.name),
      email: this.#fb.control(value.email),
    });

    this.profileForm.setValue(tempForm.getRawValue());
  }
}
