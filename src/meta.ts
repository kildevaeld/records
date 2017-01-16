
import { Item } from './visitor'

export interface GenerateOptions {
    split: boolean;
}

export interface Result {
    name: string;
    data: Buffer;
}

export interface Description {
    name: string;
    extname: string;
    run(item: Item, options: GenerateOptions): Promise<Result[]>
}