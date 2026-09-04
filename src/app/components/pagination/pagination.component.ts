import {Component, Input, OnChanges, Output, EventEmitter, AfterViewInit, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './pagination.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./pagination.component.scss'],
})

export class PaginationComponent implements OnChanges {

  @Input() totalRecords = 0;
  @Input() recordsPerPage = 0;
  @Input() numbersToShow = 2;
  @Input() numbersToShowEdge = 4;
  @Input() activePage = 1;
  @Input() class = '';

  @Output() onPageChange: EventEmitter<number> = new EventEmitter();

  pages: number [] = [];
  totalPages: number = 0;

  ngOnChanges(): any {
    const pageCount = this.getPageCount();
    this.pages = this.getArrayOfPage(pageCount);
  }

  private getPageCount(): number {
    this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage)

    let totalPage = 0;

    if (this.totalRecords > 0 && this.recordsPerPage > 0) {
      const pageCount = this.totalRecords / this.recordsPerPage;
      const roundedPageCount = Math.floor(pageCount);

      totalPage = roundedPageCount < pageCount ? roundedPageCount + 1 : roundedPageCount;
    }

    return totalPage;
  }

  private getArrayOfPage(pageCount: number): number [] {

    if (pageCount <= 1) {
      return [];
    }

    const result = [];

    if (this.activePage <= this.numbersToShow) {
      let before_numbers = this.activePage - this.numbersToShow + 1;

      for (let i = 1; i <= before_numbers; i++) {
        result.push(i);
      }

      for (let i = this.activePage; i <= Math.min(this.activePage + this.numbersToShowEdge - before_numbers, this.totalPages); i++) {
        result.push(i);
      }
    }
    else if (this.activePage === pageCount) {
      for (let i = Math.max(this.activePage - this.numbersToShowEdge, 1); i <= this.activePage; i++) {
        result.push(i);
      }
    }
    else if (this.activePage + this.numbersToShow > pageCount) {
      let after_numbers = pageCount - this.activePage;

      for (let i = Math.max(this.activePage - this.numbersToShow - after_numbers, 1); i < this.activePage; i++) {
        result.push(i);
      }

      for (let i = this.activePage; i <= pageCount; i++) {
        result.push(i);
      }
    }
    else {
      for (let i = this.activePage - this.numbersToShow; i <= this.activePage + this.numbersToShow; i++) {
        result.push(i);
      }
    }

    return result;
  }

  onPageClick(pageNumber: number) {
    if (pageNumber !== this.activePage && pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.activePage = pageNumber;
      this.onPageChange.emit(this.activePage);

      const pageCount = this.getPageCount();
      this.pages = this.getArrayOfPage(pageCount);
    }
  }
}
