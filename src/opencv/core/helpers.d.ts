import { Mat } from './Mat'
import { int } from './_types'

export function matFromArray<T>(rows: int, cols: int, type: int, array: ArrayLike<T>): Mat

export function matFromImageData(imageData: ImageData): Mat