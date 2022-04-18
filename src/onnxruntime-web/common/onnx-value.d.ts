import { Tensor } from './tensor';
declare type NonTensorType = never;
/**
 * Type OnnxValue Represents both tensors and non-tensors value for model's inputs/outputs.
 *
 * NOTE: currently not support non-tensor
 */
export declare type OnnxValue = Tensor | NonTensorType;
export {};
