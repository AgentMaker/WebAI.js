import { Tensor, TypedTensor } from './tensor';
interface Properties {
    /**
     * Get the number of elements in the tensor.
     */
    readonly size: number;
}
export interface TypedShapeUtils<T extends Tensor.Type> {
    /**
     * Create a new tensor with the same data buffer and specified dims.
     *
     * @param dims - New dimensions. Size should match the old one.
     */
    reshape(dims: readonly number[]): TypedTensor<T>;
}
export interface TypedTensorUtils<T extends Tensor.Type> extends Properties, TypedShapeUtils<T> {
}
export {};
