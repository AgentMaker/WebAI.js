import { Tensor as TensorInterface } from './tensor';
declare type TensorType = TensorInterface.Type;
declare type TensorDataType = TensorInterface.DataType;
export declare class Tensor implements TensorInterface {
    constructor(type: TensorType, data: TensorDataType | readonly number[] | readonly boolean[], dims?: readonly number[]);
    constructor(data: TensorDataType | readonly boolean[], dims?: readonly number[]);
    readonly dims: readonly number[];
    readonly type: TensorType;
    readonly data: TensorDataType;
    readonly size: number;
    reshape(dims: readonly number[]): Tensor;
}
export {};
