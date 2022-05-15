import { Mat } from './Mat'
import { int } from './_types'


// JS only helper functions
/**
 * Renders an input Mat to a canvas object
 * @param canvasSource HTMLCanvas element or id of HTMLCanvas to output Mat to
 * @param mat input source mat
 */
export function imshow(canvasSource: string | HTMLCanvasElement, mat: Mat): void;
/**
 * Reads image data from a source canvas and outputs it to an instance of cv.Mat
 * @param imageSource source canvas to read imagedata from
 */
export function imread(imageSource: string | HTMLImageElement | HTMLCanvasElement): Mat;

/**
 * Create a Mat from the specified image data.
 * @param imageData image data used to create the Mat
 */
export function matFromImageData(imageData: ImageData): Mat

/**
 * Create a Mat from a data array.
 * @param rows number of rows of the Mat.
 * @param cols number of columns of the Mat.
 * @param type data type of the Mat.
 * @param array source data array.
 */
export function matFromArray<T>(rows: int, cols: int, type: int, array: ArrayLike<T>): Mat

/**
 * Function called when opencv is initialized
 */
export function onRuntimeInitialized(): void;
export function init(): Promise<void>