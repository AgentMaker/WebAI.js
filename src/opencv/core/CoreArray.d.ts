import { Mat } from './Mat';
import { DataTypes } from './HalInterface';
import { CovarFlags, NDArray } from './Core';
import { MatVector, Point, Scalar } from '../opencv';
import { SortFlags } from './Utils';

declare module CoreArray {
    enum DecompTypes {
        DECOMP_LU = 0,
        DECOMP_SVD = 1,
        DECOMP_EIG = 2,
        DECOMP_CHOLESKY = 3,
        DECOMP_QR = 4,
        DECOMP_NORMAL = 16,
    }

    interface _DecompTypes {
        DECOMP_LU: DecompTypes.DECOMP_LU;
        DECOMP_SVD: DecompTypes.DECOMP_SVD;
        DECOMP_EIG: DecompTypes.DECOMP_EIG;
        DECOMP_CHOLESKY: DecompTypes.DECOMP_CHOLESKY;
        DECOMP_QR: DecompTypes.DECOMP_QR;
        DECOMP_NORMAL: DecompTypes.DECOMP_NORMAL;
    }

    enum BorderTypes {
        BORDER_CONSTANT = 0,
        BORDER_REPLICATE = 1,
        BORDER_REFLECT = 2,
        BORDER_WRAP = 3,
        BORDER_REFLECT_101 = 4,
        BORDER_TRANSPARENT = 5,
        BORDER_REFLECT101 = BORDER_REFLECT_101,
        BORDER_DEFAULT = BORDER_REFLECT_101,
        BORDER_ISOLATED = 16,
    }

    interface _BorderTypes {
        BORDER_CONSTANT: BorderTypes.BORDER_CONSTANT;
        BORDER_REPLICATE: BorderTypes.BORDER_REPLICATE;
        BORDER_REFLECT: BorderTypes.BORDER_REFLECT;
        BORDER_WRAP: BorderTypes.BORDER_WRAP;
        BORDER_REFLECT_101: BorderTypes.BORDER_REFLECT_101;
        BORDER_TRANSPARENT: BorderTypes.BORDER_TRANSPARENT;
        BORDER_REFLECT101: BorderTypes.BORDER_REFLECT101;
        BORDER_DEFAULT: BorderTypes.BORDER_DEFAULT;
        BORDER_ISOLATED: BorderTypes.BORDER_ISOLATED;
    }

    enum CmpTypes {
        CMP_EQ = 0,
        CMP_GT = 1,
        CMP_GE = 2,
        CMP_LT = 3,
        CMP_LE = 4,
        CMP_NE = 5,
    }

    interface _CmpTypes {
        CMP_EQ: CmpTypes.CMP_EQ;
        CMP_GT: CmpTypes.CMP_GT;
        CMP_GE: CmpTypes.CMP_GE;
        CMP_LT: CmpTypes.CMP_LT;
        CMP_LE: CmpTypes.CMP_LE;
        CMP_NE: CmpTypes.CMP_NE;
    }

    enum DftFlags {
        DFT_INVERSE = 1,
        DFT_SCALE = 2,
        DFT_ROWS = 4,
        DFT_COMPLEX_OUTPUT = 16,
        DFT_REAL_OUTPUT = 32,
        DFT_COMPLEX_INPUT = 64,
        DCT_INVERSE = DFT_INVERSE,
        DCT_ROWS = DFT_ROWS,
    }

    interface _DftFlags {
        DFT_INVERSE: DftFlags.DFT_INVERSE;
        DFT_SCALE: DftFlags.DFT_SCALE;
        DFT_ROWS: DftFlags.DFT_ROWS;
        DFT_COMPLEX_OUTPUT: DftFlags.DFT_COMPLEX_OUTPUT;
        DFT_REAL_OUTPUT: DftFlags.DFT_REAL_OUTPUT;
        DFT_COMPLEX_INPUT: DftFlags.DFT_COMPLEX_INPUT;
        DCT_INVERSE: DftFlags.DCT_INVERSE;
        DCT_ROWS: DftFlags.DCT_ROWS;
    }

    enum GemmFlags {
        GEMM_1_T = 1,
        GEMM_2_T = 2,
        GEMM_3_T = 4,
    }

    interface _GemmFlags {
        GEMM_1_T: GemmFlags.GEMM_1_T;
        GEMM_2_T: GemmFlags.GEMM_2_T;
        GEMM_3_T: GemmFlags.GEMM_3_T;
    }

    enum NormTypes {
        NORM_INF = 1,
        NORM_L1 = 2,
        NORM_L2 = 4,
        NORM_L2SQR = 5,
        NORM_HAMMING = 6,
        NORM_HAMMING2 = 7,
        NORM_TYPE_MASK = 7,
        NORM_RELATIVE = 8,
        NORM_MINMAX = 32,
    }

    interface _NormTypes {
        NORM_INF: NormTypes.NORM_INF;
        NORM_L1: NormTypes.NORM_L1;
        NORM_L2: NormTypes.NORM_L2;
        NORM_L2SQR: NormTypes.NORM_L2SQR;
        NORM_HAMMING: NormTypes.NORM_HAMMING;
        NORM_HAMMING2: NormTypes.NORM_HAMMING2;
        NORM_TYPE_MASK: NormTypes.NORM_TYPE_MASK;
        NORM_RELATIVE: NormTypes.NORM_RELATIVE;
        NORM_MINMAX: NormTypes.NORM_MINMAX;
    }

    enum ReduceTypes {
        REDUCE_SUM = 0,
        REDUCE_AVG = 1,
        REDUCE_MAX = 2,
        REDUCE_MIN = 3,
    }

    interface _ReduceTypes {
        REDUCE_SUM: ReduceTypes.REDUCE_SUM;
        REDUCE_AVG: ReduceTypes.REDUCE_AVG;
        REDUCE_MAX: ReduceTypes.REDUCE_MAX;
        REDUCE_MIN: ReduceTypes.REDUCE_MIN;
    }

    enum RotateFlags {
        ROTATE_90_CLOCKWISE = 0,
        ROTATE_180 = 1,
        ROTATE_90_COUNTERCLOCKWISE = 2,
    }

    interface _RotateFlags {
        ROTATE_90_CLOCKWISE: RotateFlags.ROTATE_90_CLOCKWISE;
        ROTATE_180: RotateFlags.ROTATE_180;
        ROTATE_90_COUNTERCLOCKWISE: RotateFlags.ROTATE_90_COUNTERCLOCKWISE;
    }

    interface CoreArray {
        /**
         * Calculates the per-element absolute difference between two arrays or between an array and a scalar.
         * @param src1 first input array.
         * @param src2 second input array.
         * @param dst output array that has the same size and type as input arrays.
         */
        absdiff(src1: Mat, src2: Mat, dst: Mat): void;
        /**
         *
         * @param src1 first input array.
         * @param src2 second input array.
         * @param dst output array that has the same size and type as input arrays.
         * @param mask optional operation mask - 8-bit single channel array, that specifies elements of the output array to be changed.
         * @param dtype optional depth of the output array.
         */
        add(src1: Mat, src2: Mat, dst: Mat, mask?: Mat): void;
        add(src1: Mat, src2: Mat, dst: Mat, mask: Mat, dtype: number | DataTypes): void;
        /**
         *
         * @param src1 first input array.
         * @param alpha weight of the first array elements.
         * @param src2 second input array of the same size and channel number as src1.
         * @param beta weight of the second array elements.
         * @param gamma scalar added to each sum.
         * @param dst output array that has the same size and number of channels as the input arrays.
         * @param dtype optional depth of the output array; when both input arrays have the same depth, dtype can be set to -1, which will be equivalent to src1.depth().
         */
        addWeighted(
            src1: Mat,
            alpha: number,
            src2: Mat,
            beta: number,
            gamma: number,
            dst: Mat,
            dtype?: number | DataTypes
        ): void;
        /**
         * naive nearest neighbor finder
         * @todo document when it's updated in opencv documentation
         */
        batchDistance(
            src1: Mat,
            src2: Mat,
            dist: Mat,
            dtype: number | DataTypes,
            nidx: Mat,
            normType: NormTypes,
            K: number,
            mask: Mat,
            update: number,
            crosscheck: boolean
        ): void;
        /**
         * computes bitwise conjunction of the two arrays (dst = src1 & src2) Calculates the per-element bit-wise conjunction of two arrays or an array and a scalar.
         * @param src1 first input array or a scalar.
         * @param src2 second input array or a scalar.
         * @param dst output array that has the same size and type as the input arrays.
         * @param mask optional operation mask, 8-bit single channel array, that specifies elements of the output array to be changed.
         */
        bitwise_and(src1: Mat, src2: Mat, dst: Mat, mask?: Mat): void;
        /**
         * Inverts every bit of an array.
         * @param src input array.
         * @param dst output array that has the same size and type as the input array.
         * @param mask optional operation mask, 8-bit single channel array, that specifies elements of the output array to be changed.
         */
        bitwise_not(src: Mat, dst: Mat, mask?: Mat): void;
        /**
         * Calculates the per-element bit-wise disjunction of two arrays or an array and a scalar.
         * @param src1 first input array or a scalar.
         * @param src2 second input array or a scalar.
         * @param dst output array that has the same size and type as the input arrays.
         * @param mask optional operation mask, 8-bit single channel array, that specifies elements of the output array to be changed.
         */
        bitwise_or(src1: Mat, src2: Mat, dst: Mat, mask?: Mat): void;
        /**
         * Calculates the per-element bit-wise "exclusive or" operation on two arrays or an array and a scalar.
         * @param src1 first input array or a scalar.
         * @param src2 second input array or a scalar.
         * @param dst output array that has the same size and type as the input arrays.
         * @param mask optional operation mask, 8-bit single channel array, that specifies elements of the output array to be changed.
         */
        bitwise_xor(src1: Mat, src2: Mat, dst: Mat, mask?: Mat): void;
        /**
         * Computes the source location of an extrapolated pixel.
         * @param p 0-based coordinate of the extrapolated pixel along one of the axes, likely <0 or >= len
         * @param len Length of the array along the corresponding axis.
         * @param borderType Border type, one of the BorderTypes, except for BORDER_TRANSPARENT and BORDER_ISOLATED . When borderType==BORDER_CONSTANT , the function always returns -1, regardless of p and len
         */
        borderInterpolate(p: number, len: number, borderType: BorderTypes): number;
        /**
         * Calculates the covariance matrix of a set of vectors.
         * @param samples samples stored as separate matrices
         * @param nsamples number of samples
         * @param covar output covariance matrix of the type ctype and square size.
         * @param mean input or output (depending on the flags) array as the average value of the input vectors.
         * @param flags operation flags as a combination of CovarFlags
         * @param ctype type of the matrix
         */
        calcCovarMatrix(
            samples: Mat,
            nsamples: number,
            covar: Mat,
            mean: Mat,
            flags: CovarFlags,
            ctype: DataTypes
        ): void;
        calcCovarMatrix(
            samples: Mat,
            covar: Mat,
            mean: Mat,
            flags: CovarFlags,
            ctype: DataTypes
        ): void;
        /**
         * Calculates the magnitude and angle of 2D vectors.
         * @param x array of x-coordinates; this must be a single-precision or double-precision floating-point array
         * @param y array of y-coordinates, that must have the same size and same type as x.
         * @param magnitude output array of magnitudes of the same size and type as x
         * @param angle output array of angles that has the same size and type as x; the angles are measured in radians (from 0 to 2*Pi) or in degrees (0 to 360 degrees).
         * @param angleInDegreesa flag, indicating whether the angles are measured in radians (which is by default), or in degrees.
         */
        cartToPolar(
            x: MatVector | Mat,
            y: MatVector | Mat,
            magnitude: MatVector | Mat,
            angle: MatVector | Mat,
            angleInDegrees?: boolean
        ): void;
        /**
         * Checks every element of an input array for invalid values.
         * @param a input array.
         * @param quiet a flag, indicating whether the functions quietly return false when the array elements are out of range or they throw an exception
         * @param pos optional output parameter, when not NULL, must be a pointer to array of src.dims elements.
         * @param minVal inclusive lower boundary of valid values range.
         * @param maxVal exclusive upper boundary of valid values range.
         */
        checkRange(
            a: MatVector | Mat,
            quiet: boolean,
            pos: Point,
            minVal: number,
            maxVal: number
        ): void;
        /**
         * Performs the per-element comparison of two arrays or an array and scalar value
         * @param src1 first input array or a scalar; when it is an array, it must have a single channel
         * @param src2 second input array or a scalar; when it is an array, it must have a single channel
         * @param dst output array of type ref CV_8U that has the same size and the same number of channels as the input arrays
         * @param cmpopa flag, that specifies correspondence between the arrays (cv.CmpTypes)
         */
        compare(src1: Mat, src2: Mat, dst: Mat, cmpop: CmpTypes): void;
        /**
         * Copies the lower or the upper half of a square matrix to its another half.
         * @param m input-output floating-point square matrix
         * @param lowerToUpper operation flag; if true, the lower half is copied to the upper half. Otherwise, the upper half is copied to the lower half.
         */
        completeSymm(m: MatVector | Mat, lowerToUpper: boolean): void;
        /**
         * Converts an array to half precision floating number.
         * @param src input array
         * @param dst output array
         */
        convertFp16(src: Mat, dst: Mat): void;
        /**
         * Scales, calculates absolute values, and converts the result to 8-bit.
         * @param src input array
         * @param dst output array
         * @param alpha optional scale factor
         * @param beta optional delta added to the scaled values
         */
        convertScaleAbs(src: Mat, dst: Mat, alpha?: number): void;
        convertScaleAbs(src: Mat, dst: Mat, alpha: number, beta?: number): void;
        convertScaleAbs(src: Mat, dst: Mat, alpha: number, beta: number): void;
        /**
         * Forms a border around an image.
         * @param src Source image
         * @param dst Destination image of the same type as src and the size Size(src.cols+left+right, src.rows+top+bottom)
         * @param top the top pixels
         * @param bottom the bottom pixels
         * @param left the left pixels
         * @param right Parameter specifying how many pixels in each direction from the source image rectangle to extrapolate. For example, top=1, bottom=1, left=1, right=1 mean that 1 pixel-wide border needs to be built
         * @param borderType Border type. See borderInterpolate for details
         * @param value Border value if borderType==BORDER_CONSTANT
         */
        copyMakeBorder(
            src: Mat,
            dst: Mat,
            top: number,
            bottom: number,
            left: number,
            right: number,
            borderType: BorderTypes,
            value: Scalar
        ): void;
        /**
         * This is an overloaded member function, provided for convenience (python) Copies the matrix to another one.
         * @param src source matrix
         * @param dst Destination matrix. If it does not have a proper size or type before the operation, it is reallocated
         * @param mask Operation mask of the same size as *this. Its non-zero elements indicate which matrix elements need to be copied. The mask has to be of type CV_8U and can have 1 or multiple channels
         */
        copyTo(src: Mat, dst: Mat, mask: Mat): void;
        /**
         * Counts non-zero array elements.
         * @param src single-channel array
         * @returns the number of non-zero elements in src
         */
        countNonZero(src: MatVector | Mat): number;
        /**
         * Performs a forward or inverse discrete Cosine transform of 1D or 2D array.
         * @param src input floating-point array
         * @param dst output array of the same size and type as src
         * @param flags transformation flags as a combination of cv.DftFlags (DCT_*)
         */
        dct(src: Mat, dst: Mat, flags: DftFlags): void;
        /**
         * Returns the determinant of a square floating-point matrix.
         * @param src input matrix that must have CV_32FC1 or CV_64FC1 type and square size.
         * @returns the determinant of the specified matrix
         */
        determinant(src: Mat): number;
        /**
         * Performs a forward or inverse Discrete Fourier transform of a 1D or 2D floating-point array.
         * @param src input array that could be real or complex
         * @param dst output array whose size and type depends on the flags
         * @param flags transformation flags, representing a combination of the DftFlags
         * @param nonzeroRows when the parameter is not zero, the function assumes that only the first nonzeroRows rows of
         * the input array (DFT_INVERSE is not set) or only the first nonzeroRows of the output array (DFT_INVERSE is set)
         * contain non-zeros, thus, the function can handle the rest of the rows more efficiently and save some time; this
         * technique is very useful for calculating array cross-correlation or convolution using DFT.
         */
        dft(src: Mat, dst: Mat, flags: DftFlags, nonzeroRows: number): void;
        /**
         *
         * @param src1 first input array.
         * @param src2 second input array of the same size and type as src1.
         * @param dst output array of the same size and type as src2.
         * @param scale scalar factor
         * @param dtype optional depth of the output array; if -1, dst will have depth src2.depth(), but in case of an array-by-array division, you can only pass -1 when src1.depth()==src2.depth().
         */
        divide(src1: Mat, src2: Mat, dst: Mat, scale: number, dtype?: number): void;
        divide(scale: number, src2: Mat, dst: Mat, dtype?: number): void;
        /**
         * Calculates eigenvalues and eigenvectors of a symmetric matrix
         * @param src input matrix that must have CV_32FC1 or CV_64FC1 type, square size and be symmetrical (src ^T^ == src)
         * @param eigenvalues output vector of eigenvalues of the same type as src; the eigenvalues are stored in the descending order
         * @param eigenvectors output matrix of eigenvectors; it has the same size and type as src; the eigenvectors are stored as subsequent matrix rows, in the same order as the corresponding eigenvalues
         */
        eigen(src: Mat, eigenvalues: Mat, eigenvectors: Mat): void;
        /**
         * Calculates eigenvalues and eigenvectors of a non-symmetric matrix (real eigenvalues only)
         * @param src input matrix (CV_32FC1 or CV_64FC1 type)
         * @param eigenvalues output vector of eigenvalues (type is the same type as src)
         * @param eigenvectors output matrix of eigenvectors (type is the same type as src). The eigenvectors are stored as subsequent matrix rows, in the same order as the corresponding eigenvalues
         */
        eigenNonSymmetric(src: Mat, eigenvalues: Mat, eigenvectors: Mat): void;
        /**
         * Calculates the exponent of every array element.
         * @param src input array
         * @param dst output array of the same size and type as src
         */
        exp(src: Mat, dst: Mat): void;
        /**
         * Extracts a single channel from src (coi is 0-based index)
         * @param src input array
         * @param dst output array
         * @param coi index of channel to extract
         */
        extractChannel(src: Mat, dst: Mat, coi: number): void;
        /**
         * Returns the list of locations of non-zero pixels
         * @param src single-channel array
         * @param idx the output array, type of cv.Mat or Array<Point>, corresponding to non-zero indices in the input
         */
        findNonZero(src: Mat, idx: Mat | NDArray<Point>): void;
        /**
         * Flips a 2D array around vertical, horizontal, or both axes
         * @param src input array
         * @param dst output array of the same size and type as src
         * @param flipCode a flag to specify how to flip the array; 0 means flipping around the x-axis and positive value (for example, 1) means flipping around y-axis. Negative value (for example, -1) means flipping around both axes
         */
        flip(src: Mat, dst: Mat, flipCode: number): void;
        /**
         * Performs generalized matrix multiplication
         * @param src1 first multiplied input matrix that could be real(CV_32FC1, CV_64FC1) or complex(CV_32FC2, CV_64FC2)
         * @param src2 second multiplied input matrix of the same type as src1
         * @param alpha weight of the matrix product
         * @param src3 third optional delta matrix added to the matrix product; it should have the same type as src1 and src2.
         * @param beta weight of src3
         * @param dst output matrix; it has the proper size and the same type as input matrices
         * @param flags operation flags (cv.GemmFlags)
         */
        gemm(
            src1: Mat,
            src2: Mat,
            alpha: number,
            src3: Mat,
            beta: number,
            dst: Mat,
            flags: GemmFlags
        ): void;
        /**
         * Calculates the optimal DFT size for a given vector size.
         * @param vecsize vector size
         * @returns the optimal DFT size for a given vector size.
         */
        getOptimalDFTSize(vecsize: number): number;
        /**
         * Applies horizontal concatenation to given matrices
         * @param src input array or vector of matrices. all of the matrices must have the same number of rows and the same depth
         * @param dst output array. It has the same number of rows and depth as the src, and the sum of cols of the src
         */
        hconcat(srcs: MatVector, dst: Mat): void;
        /**
         * Calculates the inverse Discrete Fourier Transform of a 1D or 2D array
         * @param src input floating-point real or complex array
         * @param dst output array whose size and type depend on the flags
         * @param flags operation flags (see dft and DftFlags).
         * @param nonzeroRows number of dst rows to process
         */
        idft(src: Mat, dst: Mat, flags: DftFlags, nonzeroRows: number): void;
        /**
         * Checks if array elements lie between the elements of two other arrays.
         * @param src first input array
         * @param lowerb inclusive lower boundary array or a scalar
         * @param upperb inclusive upper boundary array or a scalar
         * @param dst output array of the same size as src and CV_8U type
         */
        inRange(
            src: Mat,
            lowerb: MatVector | Mat,
            upperb: MatVector | Mat,
            dst: Mat
        ): void;
        /**
         * Inserts a single channel to dst (coi is 0-based index)
         * @param src input array
         * @param dst output array
         * @param coi output array
         */
        insertChannel(src: Mat, dst: Mat, coi: number): void;
        /**
         * Finds the inverse or pseudo-inverse of a matrix.
         * @param src input floating-point M x N matrix
         * @param dst output matrix of N x M size and the same type as src
         * @param flags inversion method (cv.DecompTypes)
         */
        invert(src: Mat, dst: Mat, flags: DecompTypes): void;
        /**
         * Calculates the natural logarithm of every array element
         * @param src input array
         * @param dst output array of the same size and type as src
         */
        log(src: Mat, dst: Mat): void;
        /**
         * Performs a look-up table transform of an array
         * @param src input array of 8-bit elements
         * @param lut look-up table of 256 elements; in case of multi-channel input array, the table should either have a single channel (in this case the same table is used for all channels) or the same number of channels as in the input array
         * @param dst output array of the same size and number of channels as src, and the same depth as lut
         */
        LUT(src: Mat, lut: Mat, dst: Mat): void;
        /**
         * Calculates the magnitude of 2D vectors
         * @param x floating-point array of x-coordinates of the vectors
         * @param y floating-point array of y-coordinates of the vectors; it must have the same size as x.
         * @param magnitude output array of the same size and type as x
         */
        magnitude(x: MatVector | Mat, y: MatVector | Mat, magnitude: Mat): void;
        /**
         * Calculates the Mahalanobis distance between two vectors
         * @param v1 first 1D input vector
         * @param v2 second 1D input vector
         * @param icovar inverse covariance matrix
         */
        Mahalanobis(v1: MatVector | Mat, v2: MatVector | Mat, icovar: Mat): void;
        /**
         * Calculates per-element maximum of two arrays or an array and a scalar
         * @param src1 first input array
         * @param src2 second input array of the same size and type as src1
         * @param dst output array of the same size and type as src1
         */
        max(src1: Mat, src2: Mat, dst: Mat): void;
        /**
         * Calculates an average (mean) of array elements
         * @param src input array that should have from 1 to 4 channels so that the result can be stored in Scalar
         * @param mask optional operation mask
         * @returns a Scalar which contains the average of each channel
         */
        mean(src: Mat, mask?: Mat): Scalar;
        /**
         * Calculates a mean and standard deviation of array elements
         * @param src input array that should have from 1 to 4 channels so that the results can be stored in Scalar
         * @param mean output parameter: calculated mean value
         * @param stddev output parameter: calculated standard deviation
         * @param mask optional operation mask
         */
        meanStdDev(src: Mat, mean: Mat, stddev: Mat, mask?: Mat): void;
        /**
         * Creates one multi-channel array out of several single-channel ones
         * @param mv input array of matrices to be merged; all the matrices in mv must have the same size and the same depth
         * @param count number of input matrices when mv is a plain C array; it must be greater than zero
         * @param dst output array of the same size and the same depth as mv[0]; The number of channels will be equal to the parameter count
         */
        merge(mv: Mat | MatVector, count: number, dst: Mat): void;
        /**
         * This is an overloaded member function, provided for convenience.
         * @param mv input vector of matrices to be merged; all the matrices in mv must have the same size and the same depth
         * @param dst output array of the same size and the same depth as mv[0]; The number of channels will be the total number of channels in the matrix array
         */
        merge(mv: Mat | MatVector, dst: Mat): void;
        /**
         * Calculates per-element minimum of two arrays or an array and a scalar
         * @param src1 first input array
         * @param src2 second input array of the same size and type as src1
         * @param dst output array of the same size and type as src1
         */
        min(src1: Mat, src2: Mat, dst: Mat): void;
        /**
         * Finds the global minimum and maximum in an array
         * @param src input single-channel array
         * @param minVal pointer to the returned minimum value; NULL is used if not required
         * @param maxVal pointer to the returned maximum value; NULL is used if not required
         * @param minIdx pointer to the returned minimum location (in nD case); NULL is used if not required; Otherwise, it must point to an array of src.dims elements, the coordinates of the minimum element in each dimension are stored there sequentially
         * @param maxIdx pointer to the returned maximum location (in nD case). NULL is used if not required
         * @param mask specified array region
         */
        minMaxIdx(
            src: Mat,
            minVal: number,
            maxVal: number,
            minIdx: number,
            maxIdx: number,
            mask: Mat
        ): void;
        /**
         * Finds the global minimum and maximum in an array
         * @param src input single-channel array
         * @param mask optional mask used to select a sub-array
         */
        minMaxLoc(
            src: Mat,
            mask?: Mat
        ): { minVal: number; maxVal: number; minLoc: Point; maxLoc: Point };
        /**
         * Copies specified channels from input arrays to the specified channels of output arrays
         * @param src input array or vector of matrices; all of the matrices must have the same size and the same depth
         * @param nsrcs number of matrices in src.
         * @param dst output array or vector of matrices; all the matrices must be allocated; their size and depth must be the same as in src[0].
         * @param ndsts number of matrices in dst.
         * @param fromTo array of index pairs specifying which channels are copied and where; fromTo[k*2] is a 0-based index of the input channel in src, fromTo[k*2+1] is an index of the output channel in dst; the continuous channel numbering is used: the first input image channels are indexed from 0 to src[0].channels()-1, the second input image channels are indexed from src[0].channels() to src[0].channels() + src[1].channels()-1, and so on, the same scheme is used for the output image channels; as a special case, when fromTo[k*2] is negative, the corresponding output channel is filled with zero .
         * @param npairs number of index pairs in fromTo.
         */
        mixChannels(
            src: Mat,
            nsrcs: number,
            dst: Mat,
            ndsts: number,
            fromTo: number,
            npairs: number
        ): void;
        mixChannels(src: Mat, dst: Mat, fromTo: number, npairs: number): void;
        mixChannels(
            src: Mat | MatVector,
            dst: Mat | MatVector,
            fromTo: MatVector
        ): void;
        /**
         * Performs the per-element multiplication of two Fourier spectrums
         * @param a first input array
         * @param b second input array of the same size and type as src1
         * @param c output array of the same size and type as src1 .
         * @param flags operation flags; currently, the only supported flag is cv.DFT_ROWS, which indicates that each row of src1 and src2 is an independent 1D Fourier spectrum. If you do not want to use this flag, then simply add a 0 as value.
         * @param conjB optional flag that conjugates the second input array before the multiplication (true) or not (false).
         */
        mulSpectrums(a: Mat, b: Mat, c: Mat, flags: DftFlags, conjB?: boolean): void;
        /**
         * Calculates the per-element scaled product of two arrays
         * @param src1 first input array
         * @param src2 second input array of the same size and the same type as src1
         * @param dst output array of the same size and type as src1
         * @param scale optional scale factor
         * @param dtype optional depth of the output array
         */
        multiply(src1: Mat, src2: Mat, dst: Mat, scale: number, dtype?: DataTypes): void;
        /**
         * Calculates the product of a matrix and its transposition
         * @param src input single-channel matrix. Note that unlike gemm, the function can multiply not only floating-point matrices
         * @param dst output square matrix
         * @param aTa Flag specifying the multiplication ordering. See the description below
         * @param delta Optional delta matrix subtracted from src before the multiplication. When the matrix is empty ( delta=noArray() ), it is assumed to be zero, that is, nothing is subtracted. If it has the same size as src , it is simply subtracted. Otherwise, it is "repeated" (see repeat ) to cover the full src and then subtracted. Type of the delta matrix, when it is not empty, must be the same as the type of created output matrix. See the dtype parameter description below
         * @param scale Optional scale factor for the matrix product.
         * @param dtype Optional type of the output matrix. When it is negative, the output matrix will have the same type as src
         */
        mulTransposed(
            src: Mat,
            dst: Mat,
            aTa: boolean,
            delta: Mat,
            scale: number,
            dtype?: DataTypes
        ): void;
        /**
         * Calculates the absolute norm of an array
         * @param src1 first input array
         * @param normType type of the norm (see cv.NormTypes).
         * @param mask optional operation mask; it must have the same size as src1 and CV_8UC1 type.
         * @returns the absolute norm of an array
         */
        norm(src1: Mat, normType: NormTypes, mask?: Mat): number;
        /**
         * Calculates an absolute difference norm or a relative difference norm
         * @param src1 first input array
         * @param src2 second input array of the same size and the same type as src1
         * @param normType type of the norm (see cv.NormTypes).
         * @param mask optional operation mask; it must have the same size as src1 and CV_8UC1 type.
         * @returns the absolute norm of an array
         */
        norm(src1: Mat, src2: Mat, normType: NormTypes, mask?: Mat): number;
        /**
         * Calculates the absolute norm of an array
         * @param src first input array.
         * @param normType type of the norm (see NormTypes).
         */
        norm(src: Mat, normType: NormTypes): number;
        /**
         * Normalizes the norm or value range of an array.
         * @param src input array
         * @param dst output array of the same size as src
         * @param alpha norm value to normalize to or the lower range boundary in case of the range normalization
         * @param beta upper range boundary in case of the range normalization; it is not used for the norm normalization
         * @param normType normalization type (see cv::NormTypes).
         * @param dtype when negative, the output array has the same type as src; otherwise, it has the same number of channels as src and the depth =CV_MAT_DEPTH(dtype).
         * @param mask optional operation mask
         */
        normalize(
            src: Mat,
            dst: Mat,
            alpha: number,
            beta: number,
            normType: NormTypes,
            dtype: DataTypes,
            mask?: Mat
        ): void;
        normalize(
            src: Mat,
            dst: Mat,
            alpha: number,
            beta: number,
            normType: NormTypes,
            dtype?: DataTypes
        ): void;
        /**
         * Normalizes the norm or value range of an array.
         * @param src input array
         * @param dst output array of the same size as src
         * @param alpha norm value to normalize to or the lower range boundary in case of the range normalization
         * @param normType normalization type (see cv::NormTypes).
         */
        normalize(src: Mat, dst: Mat, alpha: number, normType: NormTypes): void;
        /**
         * converts NaNs to the given number
         * @param a input/output matrix (CV_32F type).
         * @param val value to convert the NaNs
         */
        patchNaNs(a: Mat | MatVector, val: number): void;
        /**
         * @todo update when documentation for this function is added
         * @param data
         * @param mean
         * @param eigenvectors
         * @param result
         */
        PCABackProject(
            data: Mat | MatVector,
            mean: Mat | MatVector,
            eigenvectors: Mat | MatVector,
            result: Mat | MatVector
        ): void;
        /**
         * Performs the perspective matrix transformation of vectors
         * @param src input two-channel or three-channel floating-point array; each element is a 2D/3D vector to be transformed
         * @param dst output array of the same size and type as src
         * @param m 3x3 or 4x4 floating-point transformation matrix.
         */
        perspectiveTransform(src: Mat, dst: Mat, m: MatVector | Mat): void;
        /**
         * Calculates the rotation angle of 2D vectors
         * @param x input floating-point array of x-coordinates of 2D vectors
         * @param y input array of y-coordinates of 2D vectors; it must have the same size and the same type as x
         * @param angle output array of vector angles; it has the same size and same type as x
         * @param angleInDegrees when true, the function calculates the angle in degrees, otherwise, they are measured in radians
         */
        phase(
            x: MatVector | Mat,
            y: MatVector | Mat,
            angle: Mat,
            angleInDegrees: boolean
        ): void;
        /**
         * Calculates x and y coordinates of 2D vectors from their magnitude and angle
         * @param magnitude input floating-point array of magnitudes of 2D vectors; it can be an empty matrix (=Mat()), in this case, the function assumes that all the magnitudes are =1; if it is not empty, it must have the same size and type as angle
         * @param angle input floating-point array of angles of 2D vectors
         * @param x output array of x-coordinates of 2D vectors; it has the same size and type as angle
         * @param y output array of y-coordinates of 2D vectors; it has the same size and type as angle
         * @param angleInDegrees when true, the input angles are measured in degrees, otherwise, they are measured in radians
         */
        polarToCart(
            magnitude: MatVector | Mat,
            angle: MatVector | Mat,
            x: MatVector | Mat,
            y: MatVector | Mat,
            angleInDegrees: boolean
        ): void;
        /**
         * Raises every array element to a power
         * @param src input array
         * @param power exponent of power
         * @param dst output array of the same size and type as src
         */
        pow(src: Mat, power: number, dst: Mat): void;
        /**
         * Computes the Peak Signal-to-Noise Ratio (PSNR) image quality metric
         * @param src1 first input array
         * @param src2 second input array of the same size as src1
         * @param R the maximum pixel value (255 by default)
         * @returns the Peak Signal-to-Noise Ratio (PSNR) image quality metric in decibels (dB)
         */
        PSNR(src1: Mat, src2: Mat, R: number): number;
        /**
         * Shuffles the array elements randomly
         * @param dst output array of random numbers; the array must be pre-allocated and have 1 to 4 channels
         * @param mean mean value (expectation) of the generated random numbers
         * @param stddev standard deviation of the generated random numbers; it can be either a vector (in which case a diagonal standard deviation matrix is assumed) or a square matrix.
         */
        randn(dst: Mat, mean: MatVector | Mat, stddev: MatVector | Mat): void;
        /**
         * Shuffles the array elements randomly
         * @param dst input/output numerical 1D array
         * @param iterFactor scale factor that determines the number of random swap operations (see the details below)
         * @param rng optional random number generator used for shuffling; if it is zero, theRNG () is used instead
         */
        randShuffle(dst: Mat, iterFactor: number, rng: number): void;
        /**
         * Generates a single uniformly-distributed random number or an array of random numbers
         * @param dst output array of random numbers; the array must be pre-allocated
         * @param low inclusive lower boundary of the generated random numbers
         * @param high exclusive upper boundary of the generated random numbers
         */
        randu(dst: Mat, low: MatVector | Mat, high: MatVector | Mat): void;
        /**
         * Reduces a matrix to a vector.
         * @param src input 2D matrix
         * @param dst output vector. Its size and type is defined by dim and dtype parameters
         * @param dim dimension index along which the matrix is reduced. 0 means that the matrix is reduced to a single row. 1 means that the matrix is reduced to a single column
         * @param rtype reduction operation that could be one of ReduceTypes
         * @param dtype when negative, the output vector will have the same type as the input matrix, otherwise, its type will be CV_MAKE_TYPE(CV_MAT_DEPTH(dtype), src.channels())
         */
        reduce(
            src: Mat,
            dst: Mat,
            dim: number,
            rtype: ReduceTypes,
            dtype: number | DataTypes
        ): void;
        /**
         * Fills the output array with repeated copies of the input array
         * @param src input array to replicate
         * @param ny Flag to specify how many times the src is repeated along the vertical axis
         * @param nx Flag to specify how many times the src is repeated along the horizontal axis
         * @param dst output array of the same type as src.
         */
        repeat(src: Mat, ny: number, nx: number, dst: Mat): void;
        repeat(src: Mat, ny: number, nx: number): Mat;
        /**
         * Calculates the sum of a scaled array and another array
         * @param src1 first input array.
         * @param alpha scale factor for the first array
         * @param src2 second input array of the same size and type as src1
         * @param dst output array of the same size and type as src1
         */
        scaleAdd(src1: Mat, alpha: number, src2: Mat, dst: Mat): void;
        /**
         * Initializes a scaled identity matrix
         * @param mtx matrix to initialize (not necessarily square).
         * @param s value to assign to diagonal elements
         */
        setIdentity(mtx: Mat, s: Scalar): void;
        /**
         * Sets state of default random number generator
         * @param seed new state for default random number generator
         */
        setRNGSeed(seed: number): void;
        /**
         * Solves one or more linear systems or least-squares problems
         * @param src1 input matrix on the left-hand side of the system
         * @param src2 input matrix on the right-hand side of the system
         * @param dst output solution
         * @param flags solution (matrix inversion) method (DecompTypes)
         */
        solve(src1: Mat, src2: Mat, dst: Mat, flags: DecompTypes): boolean;
        /**
         * Finds the real roots of a cubic equation
         * @param coeffs equation coefficients, an array of 3 or 4 elements
         * @param roots output array of real roots that has 1 or 3 elements
         */
        solveCubic(coeffs: Mat, roots: Mat): number;
        /**
         * Finds the real or complex roots of a polynomial equation
         * @param src array of polynomial coefficients
         * @param dst output (complex) array of roots
         * @param maxIters maximum number of iterations the algorithm does
         */
        solvePoly(src: Mat, dst: Mat, maxIters: number): number;
        /**
         * Sorts each row or each column of a matrix.
         * @param src input single-channel array
         * @param dst output array of the same size and type as src.
         * @param flags operation flags, a combination of SortFlags
         */
        sort(src: Mat, dst: Mat, flags: SortFlags): void;
        /**
         * Sorts each row or each column of a matrix
         * @param src input single-channel array
         * @param dst output array of the same size and type as src.
         * @param flags operation flags, a combination of SortFlags
         */
        sortIdx(src: Mat, dst: Mat, flags: SortFlags): void;
        /**
         * Divides a multi-channel array into several single-channel arrays
         * @param src input multi-channel array
         * @param mvbegin output array; the number of arrays must match src.channels(); the arrays themselves are reallocated, if needed.
         */
        split(src: Mat, mvbegin: Mat): void;
        /**
         * Divides a multi-channel array into several single-channel arrays
         * @param src input multi-channel array.
         * @param mv output vector of arrays; the arrays themselves are reallocated, if needed.
         */
        split(src: Mat, mv: Mat): void;
        /**
         * Calculates a square root of array elements
         * @param src input floating-point array.
         * @param dst output array of the same size and type as src
         */
        sqrt(src: Mat, dst: Mat): void;
        /**
         *
         * @param src1 first input array or a scalar
         * @param src2 second input array or a scalar
         * @param dst output array of the same size and the same number of channels as the input array
         * @param mask optional operation mask; this is an 8-bit single channel array that specifies elements of the output array to be changed
         * @param dtype optional depth of the output array
         */
        subtract(src1: Mat, src2: Mat, dst: Mat, mask: Mat, dtype: number | DataTypes): void;
        subtract(src1: Mat, src2: Mat, dst: Mat, mask: Mat): void;
        subtract(src1: Mat, src2: Mat, dst: Mat): void;
        /**
         * Calculates the sum of array elements
         * @param src input array that must have from 1 to 4 channels
         */
        sum(src: MatVector | Mat): Scalar;
        /**
         * Returns the trace of a matrix
         * @param mtx input matrix
         */
        trace(mtx: Mat): Scalar;
        /**
         * Performs the matrix transformation of every array element
         * @param src input array that must have as many channels (1 to 4) as m.cols or m.cols-1.
         * @param dst output array of the same size and depth as src; it has as many channels as m.rows
         * @param m transformation 2x2 or 2x3 floating-point matrix
         */
        transform(src: Mat, dst: Mat, m: MatVector | Mat): void;
        /**
         * Transposes a matrix
         * @param src input array.
         * @param dst output array of the same type as src
         */
        transpose(src: Mat, dst: Mat): void;
        /**
         * Applies vertical concatenation to given matrices
         * @param src input array or vector of matrices. all of the matrices must have the same number of cols and the same depth
         * @param dst output array. It has the same number of cols and depth as the src, and the sum of rows of the src. same depth
         */
        vconcat(src: MatVector, dst: Mat): void;
    }
}
export = CoreArray;
