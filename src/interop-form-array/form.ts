import {
  effect,
  inject,
  Injector,
  runInInjectionContext,
  Service,
  signal,
  Signal,
} from '@angular/core';
import { FormArray, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { ProfileForm, ProfileFormService } from '../interop-controls/form';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, timer } from 'rxjs';
import { allEventsSignal } from '../interop-controls/form-events';
import {
  SigFCsToRegularFCs,
  SignalFormValueOf,
} from '../interop-controls/type-utils';

type ProfilesFormValue = SignalFormValueOf<FormGroup<ProfilesForm>>;

export class ProfilesForm {
  #extData = signal({ loading: false });

  public profiles = new FormArray<FormGroup<ProfileForm>>([]);

  constructor(
    value: { name: string; email: string }[],
    externalData: Signal<boolean>
  ) {
    value.forEach(_group =>
      this.profiles.push(
        new FormGroup(new ProfileForm({ name: '', email: '' }, externalData))
      )
    );
    this.profiles.setValue(value);

    effect(() => this.#extData.set({ loading: externalData() }), {
      debugName: 'set external data',
    });
  }
}

@Service()
export class ProfilesFormService {
  readonly #injector = inject(Injector);

  public loading = toSignal(timer(2000).pipe(map(() => false)), {
    initialValue: true,
  });

  public profilesForm = new FormGroup(
    new ProfilesForm([{ name: '', email: '' }], this.loading)
  );

  public profilesFormData = allEventsSignal<ProfilesFormValue>(
    this.profilesForm
  );

  public initializeForm(value: ProfilesFormValue) {
    this.profilesForm.setValue(value);
  }

  public addProfileGroup() {
    const profileForm = runInInjectionContext(
      this.#injector,
      () => new ProfileForm({ name: 'test', email: '' }, this.loading)
    );

    this.profilesForm.controls.profiles.push(new FormGroup(profileForm));
  }

  public removeProfileGroup(index: number) {
    this.profilesForm.controls.profiles.removeAt(index);
  }
}
