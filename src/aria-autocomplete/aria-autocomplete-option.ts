import { Component, input } from '@angular/core';
import { Option } from '@angular/aria/listbox';

@Component({
  selector: 'app-aria-autocomplete-option',
  imports: [Option],
  template: `
    @let value = this.value();
    <div
      class="option"
      ngOption
      [label]="value"
      [value]="value"
      (mousedown)="$event.preventDefault()">
      <span class="option-label">{{ value }}</span>
      <span
        aria-hidden="true"
        class="check-icon material-symbols-outlined"
        translate="no"
        >check</span
      >
    </div>
  `,
  styleUrl: 'aria-autocomplete-option.css',
})
export class AriaAutocompleteOption {
  public readonly value = input.required<string>();
}
