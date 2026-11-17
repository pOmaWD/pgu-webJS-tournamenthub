import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string) {
    if (!/^[0-9a-fA-F]{24}$/.test(value)) {
      throw new NotFoundException('Объект не найден');
    }
    return value;
  }
}