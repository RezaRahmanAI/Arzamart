import { Pipe, PipeTransform } from '@angular/core';

const USD_PER_BDT = 1 / 110;

@Pipe({
  name: 'bdtToUsd',
  standalone: true,
})
export class BdtToUsdPipe implements PipeTransform {
  transform(amount: number | null | undefined): number {
    if (amount === null || amount === undefined) {
      return 0;
    }

    return amount * USD_PER_BDT;
  }
}
