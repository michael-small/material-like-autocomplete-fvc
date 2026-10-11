import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { SignalFormControl } from '@angular/forms/signals/compat';

/**
 * @description Converts a form control / form group to its underlying value's type
 * @link https://blog.flensrocker.de/angular/utils/forms/2024/09/18/angular-utils-form-value-of.html
 */
export type FormValueOf<T extends AbstractControl> =
  T extends FormControl<infer TControl>
    ? TControl
    : T extends FormGroup<infer TGroup>
      ? { [K in keyof TGroup]: FormValueOf<TGroup[K]> }
      : T extends FormArray<infer TElement>
        ? FormValueOf<TElement>[]
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
export type SigFCsToRegularFCs<T extends { [K in keyof T]: AbstractControl }> =
  FormControlsOf<SignalFormValueOf<FormGroup<T>>>;
