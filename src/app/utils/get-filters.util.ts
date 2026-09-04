import {Sort} from '../interfaces/sort';

export function getFiltersUtil(filters: any, sort: Sort | null = null) {
  let filterString = '';

  for (const key in filters) {
    if (filters[key] || filters[key] === 0) {
      filterString += key + '=' + filters[key] + '&'
    }
  }

  let sortString = 'sortBy=created_at&dir=desc';

  if(sort){
    sortString = `sortBy=${sort.by}&dir=${sort.direction}`;
  }

  return filterString + sortString;
}
