import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChildGroupWithInputs } from '../interop-controls/child-group-with-inputs';
import { ProfilesFormService } from './form';

@Component({
  selector: 'app-parent-of-form-array',
  template: `
    @for (
      group of profilesFormService.profilesForm.controls.profiles.controls;
      track group
    ) {
      <div class="group">
        <app-child-group-with-inputs [group]="group" />
        <button
          type="button"
          (click)="profilesFormService.removeProfileGroup($index)">
          X
        </button>
      </div>
    }
    <button type="button" (click)="profilesFormService.addProfileGroup()">
      +
    </button>
  `,
  imports: [
    ChildGroupWithInputs,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  styles: `
    .group {
      app-child-group-with-inputs {
      }
      display: flex;
      justify-content: space-evenly;
      align-items: center;
    }
  `,
})
export class ParentOfFormArray {
  protected readonly profilesFormService = inject(ProfilesFormService);
}
