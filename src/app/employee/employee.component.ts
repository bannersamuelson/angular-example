import { Component, Input, OnInit, Output } from '@angular/core';

import { Employee } from '../employee';
import { EmployeeService } from '../employee.service';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { EditModalComponent } from '../edit/edit.component';
import { DeleteModalComponent } from '../delete/delete.component';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css'],
})
export class EmployeeComponent implements OnInit {
  @Input() employee: Employee;
  directReports: Set<Employee> = new Set();
  totalReports = 0;

  constructor(private employeeService: EmployeeService, private dialog: MatDialog) {

  }

  onEditClicked(emp: Employee) {
    const editDialogRef = this.dialog.open(EditModalComponent, { data: emp });
    editDialogRef.afterClosed().toPromise().then(res => res ?? false ? this.employeeService.save(res) : {});
  }

  onDeleteClicked(emp: Employee) {
    const deleteDialogRef = this.dialog.open(DeleteModalComponent, { data: emp });
    deleteDialogRef.afterClosed().toPromise().then(confirm => confirm ? this.employeeService.remove(emp) : {});
  }

  private async initReports(): Promise<[Set<Employee>, number]> {

    const directReports = [];
    for (const subordinate_id of this.employee.directReports ?? []) {
      let child = this.employeeService.get(subordinate_id);
      if (child instanceof Observable) {
        child = await child.toPromise();
      }
      directReports.push(child);
    }
    let totalReports = 0;
    const visited = new Set<number>();
    const todo = [];
    for (let node = this.employee; node !== undefined; node = todo.shift()) {
      visited.add(node.id);
      for (const child_id of (node.directReports ?? [])) {
        if (visited.has(child_id)) {
          continue;
        }

        let child = this.employeeService.get(child_id);
        if (child instanceof Observable) {
          child = await child.toPromise();
        }
        todo.push(child);
      }
      totalReports++;
    }
    return [new Set(directReports), totalReports - 1];
  }

  ngOnInit(): void {
    this.employeeService.empEditEvent.subscribe({
      next: (v) => {
        if (v.evt === 'delete') {
          this.directReports.delete(v.emp);
          if (this.totalReports > 0) {
            this.totalReports--;
          }
        } else if (this.directReports.has(v.emp)) {
          this.directReports.add(v.emp);
        }
      }
    });
    this.initReports().then(result => ([this.directReports, this.totalReports] = result));
  }
}
