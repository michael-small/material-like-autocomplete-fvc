import { Component, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChildGroupWithInputs } from '../interop-controls/child-group-with-inputs';
import { ProfileForm } from '../interop-controls/form';
import { ProfilesFormService } from './form';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-parent-of-form-array',
  template: `
    <span
      cdkDropList
      [cdkDropListData]="profiles"
      (cdkDropListDropped)="drop($event)">
      @for (group of profiles; track group) {
        <span cdkDrag class="group">
          <app-child-group-with-inputs [group]="group" />
          <button
            type="button"
            (click)="profilesFormService.removeProfileGroup($index)">
            X
          </button>
        </span>
      }
    </span>
    <button type="button" (click)="profilesFormService.addProfileGroup()">
      +
    </button>
  `,
  imports: [
    ChildGroupWithInputs,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    CdkDropList,
    CdkDrag,
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

  protected readonly profiles =
    this.profilesFormService.profilesForm.controls.profiles.controls;

  drop(event: CdkDragDrop<FormGroup<ProfileForm>[]>) {
    moveItemInArray(this.profiles, event.previousIndex, event.currentIndex);
  }
}
