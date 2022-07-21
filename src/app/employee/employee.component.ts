import { Component, Input } from '@angular/core';

import { Employee } from '../employee';
import { Observable } from 'rxjs';
import { EmployeeService } from '../employee.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css']
})
export class EmployeeComponent {
  @Input() employee: Employee;
  directReports: Set<Employee> = new Set();
  totalReports = 0;

  constructor(private employeeService: EmployeeService, private dialog: MatDialog) { }


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

}

