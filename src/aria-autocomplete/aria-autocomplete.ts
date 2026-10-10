import {
  Combobox,
  ComboboxPopup,
  ComboboxWidget,
} from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  afterRenderEffect,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AriaAutocompleteOption } from './aria-autocomplete-option';

@Component({
  selector: 'app-aria-autocomplete',
  templateUrl: 'aria-autocomplete.html',
  styleUrl: 'aria-autocomplete.css',
  imports: [
    Combobox,
    ComboboxPopup,
    ComboboxWidget,
    Listbox,
    Option,
    OverlayModule,
    FormsModule,
    AriaAutocompleteOption,
  ],
})
export class AriaAutocomplete {
  clear() {
    this.query.set('');
    this.selectedOption.set([]);
    this.popupExpanded.set(false);
  }

  readonly listbox = viewChild(Listbox);
  readonly combobox = viewChild(Combobox);

  popupExpanded = signal(false);
  query = signal('');
  selectedOption = signal<string[]>([]);

  countries = computed(() =>
    ALL_COUNTRIES.filter(country =>
      country.toLowerCase().startsWith(this.query().toLowerCase())
    )
  );

  constructor() {
    afterRenderEffect(() => {
      if (this.combobox()?.expanded() === true) {
        this.listbox()?.scrollActiveItemIntoView();
      }
    });
  }

  onBlur() {
    this.commitSelection();
  }

  onCommit() {
    this.commitSelection();
    this.popupExpanded.set(false);
    this.combobox()?.element.focus();
  }

  private commitSelection() {
    const selected = this.selectedOption();
    if (selected.length > 0) {
      this.query.set(selected[0]);
    } else {
      this.query.set('');
      this.selectedOption.set([]);
    }
  }
}

const ALL_COUNTRIES = [
  'Albania',
  'Afghanistan',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
];
