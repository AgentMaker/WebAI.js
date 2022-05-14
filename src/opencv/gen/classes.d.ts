import { int, float, double } from '../core/_types'
import { Mat } from '../core/Mat'
import { IntVector, FloatVector, DoubleVector, MatVector, RectVector, KeyPointVector, DMatchVector, DMatchVectorVector } from '../core/vectors'
import { AgastFeatureDetector_DetectorType, AKAZE_DescriptorType, DescriptorMatcher_MatcherType, FastFeatureDetector_DetectorType, HOGDescriptor_HistogramNormType, KAZE_DiffusivityType, ORB_ScoreType } from './enums'
import { SizeLike, PointLike, ScalarLike } from '../core/valueObjects'
import { EmClassHandle } from '../emscripten/emscripten'

/**
 * @brief Class implementing the AKAZE keypoint detector and descriptor extractor, described in @cite ANB13.
 * 
 * @details AKAZE descriptors can only be used with KAZE or AKAZE keypoints. This class is thread-safe.
 * 
 * @note When you need descriptors use Feature2D::detectAndCompute, which
 * provides better performance. When using Feature2D::detect followed by
 * Feature2D::compute scale space pyramid is computed twice.
 * 
 * @note AKAZE implements T-API. When image is passed as UMat some parts of the algorithm
 * will use OpenCL.
 * 
 * @note [ANB13] Fast Explicit Diffusion for Accelerated Features in Nonlinear
 * Scale Spaces. Pablo F. Alcantarilla, Jesús Nuevo and Adrien Bartoli. In
 * British Machine Vision Conference (BMVC), Bristol, UK, September 2013.
 */
export class AKAZE extends Feature2D {

  /**
   * @brief The AKAZE constructor
   * 
   * @param descriptor_type Type of the extracted descriptor: DESCRIPTOR_KAZE,
   * DESCRIPTOR_KAZE_UPRIGHT, DESCRIPTOR_MLDB or DESCRIPTOR_MLDB_UPRIGHT.
   * @param descriptor_size Size of the descriptor in bits. 0 -\> Full size
   * @param descriptor_channels Number of channels in the descriptor (1, 2, 3)
   * @param threshold Detector response threshold to accept point
   * @param nOctaves Maximum octave evolution of the image
   * @param nOctaveLayers Default number of sublevels per scale level
   * @param diffusivity Diffusivity type. DIFF_PM_G1, DIFF_PM_G2, DIFF_WEICKERT or
   * DIFF_CHARBONNIER
   */
  constructor(descriptor_type?: AKAZE_DescriptorType, descriptor_size?: int, descriptor_channels?: int, threshold?: float, nOctaves?: int, nOctaveLayers?: int, diffusivity?: KAZE_DiffusivityType)

  /**
   * 
   */
  getDefaultName(): string

  /**
   * 
   */
  getDescriptorChannels(): int

  /**
   * 
   */
  getDescriptorSize(): int

  /**
   * 
   */
  getDescriptorType(): AKAZE_DescriptorType

  /**
   * 
   */
  getDiffusivity(): KAZE_DiffusivityType

  /**
   * 
   */
  getNOctaveLayers(): int

  /**
   * 
   */
  getNOctaves(): int

  /**
   * 
   */
  getThreshold(): double

  /**
   * 
   */
  setDescriptorChannels(dch: int): void

  /**
   * 
   */
  setDescriptorSize(dsize: int): void

  /**
   * 
   */
  setDescriptorType(dtype: AKAZE_DescriptorType): void

  /**
   * 
   */
  setDiffusivity(diff: KAZE_DiffusivityType): void

  /**
   * 
   */
  setNOctaveLayers(octaveLayers: int): void

  /**
   * 
   */
  setNOctaves(octaves: int): void

  /**
   * 
   */
  setThreshold(threshold: double): void

}

/**
 * @brief Wrapping class for feature detection using the AGAST method. :
 */
export class AgastFeatureDetector extends Feature2D {

  /**
   * 
   */
  constructor(threshold?: int, nonmaxSuppression?: boolean, type?: AgastFeatureDetector_DetectorType)

  /**
   * 
   */
  getDefaultName(): string

  /**
   * 
   */
  getNonmaxSuppression(): boolean

  /**
   * 
   */
  getThreshold(): int

  /**
   * 
   */
  getType(): AgastFeatureDetector_DetectorType

  /**
   * 
   */
  setNonmaxSuppression(f: boolean): void

  /**
   * 
   */
  setThreshold(threshold: int): void

  /**
   * 
   */
  setType(type: AgastFeatureDetector_DetectorType): void

}

/**
 * @brief This is a base class for all more or less complex algorithms in OpenCV
 * 
 * especially for classes of algorithms, for which there can be multiple implementations. The examples
 * are stereo correspondence (for which there are algorithms like block matching, semi-global block
 * matching, graph-cut etc.), background subtraction (which can be done using mixture-of-gaussians
 * models, codebook-based algorithm etc.), optical flow (block matching, Lucas-Kanade, Horn-Schunck
 * etc.).
 * 
 * Here is example of SimpleBlobDetector use in your application via Algorithm interface:
 * @snippet snippets/core_various.cpp Algorithm
 */
export class Algorithm extends EmClassHandle {

}

/**
 * @brief This algorithm converts images to median threshold bitmaps (1 for pixels brighter than median
 * luminance and 0 otherwise) and than aligns the resulting bitmaps using bit operations.
 * 
 * It is invariant to exposure, so exposure values and camera response are not necessary.
 * 
 * In this implementation new image regions are filled with zeros.
 * 
 * For more information see @cite GW03 .
 */
export class AlignMTB extends EmClassHandle {

  /**
   * @brief Calculates shift between two images, i. e. how to shift the second image to correspond it with the
   * first.
   * 
   * @param img0 first image
   * @param img1 second image
   */
  calculateShift(img0: Mat, img1: Mat): PointLike

  /**
   * @brief Computes median threshold and exclude bitmaps of given image.
   * 
   * @param img input image
   * @param tb median threshold bitmap
   * @param eb exclude bitmap
   */
  computeBitmaps(img: Mat, tb: Mat, eb: Mat): void

  /**
   * @brief Creates AlignMTB object
   * 
   * @param max_bits logarithm to the base 2 of maximal shift in each dimension. Values of 5 and 6 are
   * usually good enough (31 and 63 pixels shift respectively).
   * @param exclude_range range for exclusion bitmap that is constructed to suppress noise around the
   * median value.
   * @param cut if true cuts images, otherwise fills the new regions with zeros.
   */
  constructor(max_bits?: int, exclude_range?: int, cut?: boolean)

  /**
   * 
   */
  getCut(): boolean

  /**
   * 
   */
  getExcludeRange(): int

  /**
   * 
   */
  getMaxBits(): int

  /**
   * 
   */
  setCut(value: boolean): void

  /**
   * 
   */
  setExcludeRange(exclude_range: int): void

  /**
   * 
   */
  setMaxBits(max_bits: int): void

  /**
   * @brief Helper function, that shift Mat filling new regions with zeros.
   * 
   * @param src input image
   * @param dst result image
   * @param shift shift value
   */
  shiftMat(src: Mat, dst: Mat, shift: PointLike): void

}

/**
 * @brief Brute-force descriptor matcher.
 * 
 * For each descriptor in the first set, this matcher finds the closest descriptor in the second set
 * by trying each one. This descriptor matcher supports masking permissible matches of descriptor
 * sets.
 */
export class BFMatcher extends DescriptorMatcher {

  /**
   * @brief Brute-force matcher create method.
   * @param normType One of NORM_L1, NORM_L2, NORM_HAMMING, NORM_HAMMING2. L1 and L2 norms are
   * preferable choices for SIFT and SURF descriptors, NORM_HAMMING should be used with ORB, BRISK and
   * BRIEF, NORM_HAMMING2 should be used with ORB when WTA_K==3 or 4 (see ORB::ORB constructor
   * description).
   * @param crossCheck If it is false, this is will be default BFMatcher behaviour when it finds the k
   * nearest neighbors for each query descriptor. If crossCheck==true, then the knnMatch() method with
   * k=1 will only return pairs (i,j) such that for i-th query descriptor the j-th descriptor in the
   * matcher's collection is the nearest and vice versa, i.e. the BFMatcher will only return consistent
   * pairs. Such technique usually produces best results with minimal number of outliers when there are
   * enough matches. This is alternative to the ratio test, used by D. Lowe in SIFT paper.
   */
  constructor(normType?: int, crossCheck?: boolean)

}

/**
 * @brief Class implementing the BRISK keypoint detector and descriptor extractor, described in @cite LCS11 .
 */
export class BRISK extends Feature2D {

  /**
   * @brief The BRISK constructor
   * 
   * @param thresh AGAST detection threshold score.
   * @param octaves detection octaves. Use 0 to do single scale.
   * @param patternScale apply this scale to the pattern used for sampling the neighbourhood of a
   * keypoint.
   */
  constructor(thresh?: int, octaves?: int, patternScale?: float)

  /**
   * @brief The BRISK constructor for a custom pattern
   * 
   * @param radiusList defines the radii (in pixels) where the samples around a keypoint are taken (for
   * keypoint scale 1).
   * @param numberList defines the number of sampling points on the sampling circle. Must be the same
   * size as radiusList..
   * @param dMax threshold for the short pairings used for descriptor formation (in pixels for keypoint
   * scale 1).
   * @param dMin threshold for the long pairings used for orientation determination (in pixels for
   * keypoint scale 1).
   * @param indexChange index remapping of the bits.
   */
  constructor(radiusList: FloatVector|float[], numberList: IntVector|int[], dMax?: float, dMin?: float, indexChange?: IntVector|int[])

  /**
   * @brief The BRISK constructor for a custom pattern, detection threshold and octaves
   * 
   * @param thresh AGAST detection threshold score.
   * @param octaves detection octaves. Use 0 to do single scale.
   * @param radiusList defines the radii (in pixels) where the samples around a keypoint are taken (for
   * keypoint scale 1).
   * @param numberList defines the number of sampling points on the sampling circle. Must be the same
   * size as radiusList..
   * @param dMax threshold for the short pairings used for descriptor formation (in pixels for keypoint
   * scale 1).
   * @param dMin threshold for the long pairings used for orientation determination (in pixels for
   * keypoint scale 1).
   * @param indexChange index remapping of the bits.
   */
  constructor(thresh: int, octaves: int, radiusList: FloatVector|float[], numberList: IntVector|int[], dMax?: float, dMin?: float, indexChange?: IntVector|int[])

  /**
   * 
   */
  getDefaultName(): string

}

/**
 * @brief Base class for background/foreground segmentation. :
 * 
 * The class is only used to define the common interface for the whole family of background/foreground
 * segmentation algorithms.
 */
export class BackgroundSubtractor extends EmClassHandle {

  /**
   * @brief Computes a foreground mask.
   * 
   * @param image Next video frame.
   * @param fgmask The output foreground mask as an 8-bit binary image.
   * @param learningRate The value between 0 and 1 that indicates how fast the background model is
   * learnt. Negative parameter value makes the algorithm to use some automatically chosen learning
   * rate. 0 means that the background model is not updated at all, 1 means that the background model
   * is completely reinitialized from the last frame.
   */
  apply(image: Mat, fgmask: Mat, learningRate?: double): void

  /**
   * @brief Computes a background image.
   * 
   * @param backgroundImage The output background image.
   * 
   * @note Sometimes the background image can be very blurry, as it contain the average background
   * statistics.
   */
  getBackgroundImage(backgroundImage: Mat): void

}

/**
 * @brief Gaussian Mixture-based Background/Foreground Segmentation Algorithm.
 * 
 * The class implements the Gaussian mixture model background subtraction described in @cite Zivkovic2004
 * and @cite Zivkovic2006 .
 */
export class BackgroundSubtractorMOG2 extends EmClassHandle {

  /**
   * @brief Computes a foreground mask.
   * 
   * @param image Next video frame. Floating point frame will be used without scaling and should be in range \f$[0,255]\f$.
   * @param fgmask The output foreground mask as an 8-bit binary image.
   * @param learningRate The value between 0 and 1 that indicates how fast the background model is
   * learnt. Negative parameter value makes the algorithm to use some automatically chosen learning
   * rate. 0 means that the background model is not updated at all, 1 means that the background model
   * is completely reinitialized from the last frame.
   */
  apply(image: Mat, fgmask: Mat, learningRate?: double): void

  /**
   * @brief Creates MOG2 Background Subtractor
   * 
   * @param history Length of the history.
   * @param varThreshold Threshold on the squared Mahalanobis distance between the pixel and the model
   * to decide whether a pixel is well described by the background model. This parameter does not
   * affect the background update.
   * @param detectShadows If true, the algorithm will detect shadows and mark them. It decreases the
   * speed a bit, so if you do not need this feature, set the parameter to false.
   */
  constructor(history?: int, varThreshold?: double, detectShadows?: boolean)

}

/**
 * @brief Base class for Contrast Limited Adaptive Histogram Equalization.
 */
export class CLAHE extends EmClassHandle {

  /**
   * @brief Equalizes the histogram of a grayscale image using Contrast Limited Adaptive Histogram Equalization.
   * 
   * @param src Source image of type CV_8UC1 or CV_16UC1.
   * @param dst Destination image.
   */
  apply(src: Mat, dst: Mat): void

  /**
   * 
   */
  collectGarbage(): void

  /**
   * @brief Creates a smart pointer to a cv::CLAHE class and initializes it.
   * 
   * @param clipLimit Threshold for contrast limiting.
   * @param tileGridSize Size of grid for histogram equalization. Input image will be divided into
   * equally sized rectangular tiles. tileGridSize defines the number of tiles in row and column.
   */
  constructor(clipLimit?: double, tileGridSize?: SizeLike)

  /**
   * 
   */
  getClipLimit(): double

  /**
   * 
   */
  getTilesGridSize(): SizeLike

  /**
   * @brief Sets threshold for contrast limiting.
   * 
   * @param clipLimit threshold value.
   */
  setClipLimit(clipLimit: double): void

  /**
   * @brief Sets size of grid for histogram equalization. Input image will be divided into
   * equally sized rectangular tiles.
   * 
   * @param tileGridSize defines the number of tiles in row and column.
   */
  setTilesGridSize(tileGridSize: SizeLike): void

}

/**
 * @brief The base class for camera response calibration algorithms.
 */
export class CalibrateCRF extends EmClassHandle {

  /**
   * @brief Recovers inverse camera response.
   * 
   * @param src vector of input images
   * @param dst 256x1 matrix with inverse camera response function
   * @param times vector of exposure time values for each image
   */
  process(src: MatVector, dst: Mat, times: Mat): void

}

/**
 * @brief Inverse camera response function is extracted for each brightness value by minimizing an objective
 * function as linear system. Objective function is constructed using pixel values on the same position
 * in all images, extra term is added to make the result smoother.
 * 
 * For more information see @cite DM97 .
 */
export class CalibrateDebevec extends EmClassHandle {

  /**
   * @brief Creates CalibrateDebevec object
   * 
   * @param samples number of pixel locations to use
   * @param lambda smoothness term weight. Greater values produce smoother results, but can alter the
   * response.
   * @param random if true sample pixel locations are chosen at random, otherwise they form a
   * rectangular grid.
   */
  constructor(samples?: int, lambda?: float, random?: boolean)

  /**
   * 
   */
  getLambda(): float

  /**
   * 
   */
  getRandom(): boolean

  /**
   * 
   */
  getSamples(): int

  /**
   * 
   */
  setLambda(lambda: float): void

  /**
   * 
   */
  setRandom(random: boolean): void

  /**
   * 
   */
  setSamples(samples: int): void

}

/**
 * @brief Inverse camera response function is extracted for each brightness value by minimizing an objective
 * function as linear system. This algorithm uses all image pixels.
 * 
 * For more information see @cite RB99 .
 */
export class CalibrateRobertson extends EmClassHandle {

  /**
   * @brief Creates CalibrateRobertson object
   * 
   * @param max_iter maximal number of Gauss-Seidel solver iterations.
   * @param threshold target difference between results of two successive steps of the minimization.
   */
  constructor(max_iter?: int, threshold?: float)

  /**
   * 
   */
  getMaxIter(): int

  /**
   * 
   */
  getRadiance(): Mat

  /**
   * 
   */
  getThreshold(): float

  /**
   * 
   */
  setMaxIter(max_iter: int): void

  /**
   * 
   */
  setThreshold(threshold: float): void

}

/**
 * @brief Cascade classifier class for object detection.
 */
export class CascadeClassifier extends EmClassHandle {

  /**
   * 
   */
  constructor()

  /**
   * @brief Loads a classifier from a file.
   * 
   * @param filename Name of the file from which the classifier is loaded.
   */
  constructor(filename: string)

  /**
   * @brief Detects objects of different sizes in the input image. The detected objects are returned as a list
   * of rectangles.
   * 
   * @param image Matrix of the type CV_8U containing an image where objects are detected.
   * @param objects Vector of rectangles where each rectangle contains the detected object, the
   * rectangles may be partially outside the original image.
   * @param scaleFactor Parameter specifying how much the image size is reduced at each image scale.
   * @param minNeighbors Parameter specifying how many neighbors each candidate rectangle should have
   * to retain it.
   * @param flags Parameter with the same meaning for an old cascade as in the function
   * cvHaarDetectObjects. It is not used for a new cascade.
   * @param minSize Minimum possible object size. Objects smaller than that are ignored.
   * @param maxSize Maximum possible object size. Objects larger than that are ignored. If `maxSize == minSize` model is evaluated on single scale.
   * 
   * The function is parallelized with the TBB library.
   * 
   * @note
   * -   (Python) A face detection example using cascade classifiers can be found at
   * opencv_source_code/samples/python/facedetect.py
   */
  detectMultiScale(image: Mat, objects: RectVector, scaleFactor?: double, minNeighbors?: int, flags?: int, minSize?: SizeLike, maxSize?: SizeLike): void

  /**
   * @overload
   * @param image Matrix of the type CV_8U containing an image where objects are detected.
   * @param objects Vector of rectangles where each rectangle contains the detected object, the
   * rectangles may be partially outside the original image.
   * @param numDetections Vector of detection numbers for the corresponding objects. An object's number
   * of detections is the number of neighboring positively classified rectangles that were joined
   * together to form the object.
   * @param scaleFactor Parameter specifying how much the image size is reduced at each image scale.
   * @param minNeighbors Parameter specifying how many neighbors each candidate rectangle should have
   * to retain it.
   * @param flags Parameter with the same meaning for an old cascade as in the function
   * cvHaarDetectObjects. It is not used for a new cascade.
   * @param minSize Minimum possible object size. Objects smaller than that are ignored.
   * @param maxSize Maximum possible object size. Objects larger than that are ignored. If `maxSize == minSize` model is evaluated on single scale.
   */
  detectMultiScale2(image: Mat, objects: RectVector, numDetections: IntVector|int[], scaleFactor?: double, minNeighbors?: int, flags?: int, minSize?: SizeLike, maxSize?: SizeLike): void

  /**
   * @overload
   * This function allows you to retrieve the final stage decision certainty of classification.
   * For this, one needs to set `outputRejectLevels` on true and provide the `rejectLevels` and `levelWeights` parameter.
   * For each resulting detection, `levelWeights` will then contain the certainty of classification at the final stage.
   * This value can then be used to separate strong from weaker classifications.
   * 
   * A code sample on how to use it efficiently can be found below:
   * @code
   * Mat img;
   * vector<double> weights;
   * vector<int> levels;
   * vector<Rect> detections;
   * CascadeClassifier model("/path/to/your/model.xml");
   * model.detectMultiScale(img, detections, levels, weights, 1.1, 3, 0, Size(), Size(), true);
   * cerr << "Detection " << detections[0] << " with weight " << weights[0] << endl;
   * @endcode
   */
  detectMultiScale3(image: Mat, objects: RectVector, rejectLevels: IntVector|int[], levelWeights: DoubleVector|double[], scaleFactor?: double, minNeighbors?: int, flags?: int, minSize?: SizeLike, maxSize?: SizeLike, outputRejectLevels?: boolean): void

  /**
   * @brief Checks whether the classifier has been loaded.
   */
  empty(): boolean

  /**
   * @brief Loads a classifier from a file.
   * 
   * @param filename Name of the file from which the classifier is loaded. The file may contain an old
   * HAAR classifier trained by the haartraining application or a new cascade classifier trained by the
   * traincascade application.
   */
  load(filename: string): boolean

}

/**
 * @brief Abstract base class for matching keypoint descriptors.
 * 
 * It has two groups of match methods: for matching descriptors of an image with another image or with
 * an image set.
 */
export class DescriptorMatcher extends EmClassHandle {

  /**
   * @brief Adds descriptors to train a CPU(trainDescCollectionis) or GPU(utrainDescCollectionis) descriptor
   * collection.
   * 
   * If the collection is not empty, the new descriptors are added to existing train descriptors.
   * 
   * @param descriptors Descriptors to add. Each descriptors[i] is a set of descriptors from the same
   * train image.
   */
  add(descriptors: MatVector): void

  /**
   * @brief Clears the train descriptor collections.
   */
  clear(): void

  /**
   * @brief Clones the matcher.
   * 
   * @param emptyTrainData If emptyTrainData is false, the method creates a deep copy of the object,
   * that is, copies both parameters and train data. If emptyTrainData is true, the method creates an
   * object copy with the current parameters but with empty train data.
   */
  constructor(emptyTrainData?: boolean)

  /**
   * @brief Creates a descriptor matcher of a given type with the default parameters (using default
   * constructor).
   * 
   * @param descriptorMatcherType Descriptor matcher type. Now the following matcher types are
   * supported:
   * -   `BruteForce` (it uses L2 )
   * -   `BruteForce-L1`
   * -   `BruteForce-Hamming`
   * -   `BruteForce-Hamming(2)`
   * -   `FlannBased`
   */
  constructor(descriptorMatcherType: string)

  /**
   * 
   */
  constructor(matcherType: DescriptorMatcher_MatcherType)

  /**
   * @brief Returns true if there are no train descriptors in the both collections.
   */
  empty(): boolean

  /**
   * @brief Returns true if the descriptor matcher supports masking permissible matches.
   */
  isMaskSupported(): boolean

  /**
   * @brief Finds the k best matches for each descriptor from a query set.
   * 
   * @param queryDescriptors Query set of descriptors.
   * @param trainDescriptors Train set of descriptors. This set is not added to the train descriptors
   * collection stored in the class object.
   * @param mask Mask specifying permissible matches between an input query and train matrices of
   * descriptors.
   * @param matches Matches. Each matches[i] is k or less matches for the same query descriptor.
   * @param k Count of best matches found per each query descriptor or less if a query descriptor has
   * less than k possible matches in total.
   * @param compactResult Parameter used when the mask (or masks) is not empty. If compactResult is
   * false, the matches vector has the same size as queryDescriptors rows. If compactResult is true,
   * the matches vector does not contain matches for fully masked-out query descriptors.
   * 
   * These extended variants of DescriptorMatcher::match methods find several best matches for each query
   * descriptor. The matches are returned in the distance increasing order. See DescriptorMatcher::match
   * for the details about query and train descriptors.
   */
  knnMatch(queryDescriptors: Mat, trainDescriptors: Mat, matches: DMatchVectorVector, k: int, mask?: Mat, compactResult?: boolean): void

  /**
   * @overload
   * @param queryDescriptors Query set of descriptors.
   * @param matches Matches. Each matches[i] is k or less matches for the same query descriptor.
   * @param k Count of best matches found per each query descriptor or less if a query descriptor has
   * less than k possible matches in total.
   * @param masks Set of masks. Each masks[i] specifies permissible matches between the input query
   * descriptors and stored train descriptors from the i-th image trainDescCollection[i].
   * @param compactResult Parameter used when the mask (or masks) is not empty. If compactResult is
   * false, the matches vector has the same size as queryDescriptors rows. If compactResult is true,
   * the matches vector does not contain matches for fully masked-out query descriptors.
   */
  knnMatch(queryDescriptors: Mat, matches: DMatchVectorVector, k: int, masks?: MatVector, compactResult?: boolean): void

  /**
   * @brief Finds the best match for each descriptor from a query set.
   * 
   * @param queryDescriptors Query set of descriptors.
   * @param trainDescriptors Train set of descriptors. This set is not added to the train descriptors
   * collection stored in the class object.
   * @param matches Matches. If a query descriptor is masked out in mask , no match is added for this
   * descriptor. So, matches size may be smaller than the query descriptors count.
   * @param mask Mask specifying permissible matches between an input query and train matrices of
   * descriptors.
   * 
   * In the first variant of this method, the train descriptors are passed as an input argument. In the
   * second variant of the method, train descriptors collection that was set by DescriptorMatcher::add is
   * used. Optional mask (or masks) can be passed to specify which query and training descriptors can be
   * matched. Namely, queryDescriptors[i] can be matched with trainDescriptors[j] only if
   * mask.at\<uchar\>(i,j) is non-zero.
   */
  match(queryDescriptors: Mat, trainDescriptors: Mat, matches: DMatchVector, mask?: Mat): void

  /**
   * @overload
   * @param queryDescriptors Query set of descriptors.
   * @param matches Matches. If a query descriptor is masked out in mask , no match is added for this
   * descriptor. So, matches size may be smaller than the query descriptors count.
   * @param masks Set of masks. Each masks[i] specifies permissible matches between the input query
   * descriptors and stored train descriptors from the i-th image trainDescCollection[i].
   */
  match(queryDescriptors: Mat, matches: DMatchVector, masks?: MatVector): void

  /**
   * @brief For each query descriptor, finds the training descriptors not farther than the specified distance.
   * 
   * @param queryDescriptors Query set of descriptors.
   * @param trainDescriptors Train set of descriptors. This set is not added to the train descriptors
   * collection stored in the class object.
   * @param matches Found matches.
   * @param compactResult Parameter used when the mask (or masks) is not empty. If compactResult is
   * false, the matches vector has the same size as queryDescriptors rows. If compactResult is true,
   * the matches vector does not contain matches for fully masked-out query descriptors.
   * @param maxDistance Threshold for the distance between matched descriptors. Distance means here
   * metric distance (e.g. Hamming distance), not the distance between coordinates (which is measured
   * in Pixels)!
   * @param mask Mask specifying permissible matches between an input query and train matrices of
   * descriptors.
   * 
   * For each query descriptor, the methods find such training descriptors that the distance between the
   * query descriptor and the training descriptor is equal or smaller than maxDistance. Found matches are
   * returned in the distance increasing order.
   */
  radiusMatch(queryDescriptors: Mat, trainDescriptors: Mat, matches: DMatchVectorVector, maxDistance: float, mask?: Mat, compactResult?: boolean): void

  /**
   * @overload
   * @param queryDescriptors Query set of descriptors.
   * @param matches Found matches.
   * @param maxDistance Threshold for the distance between matched descriptors. Distance means here
   * metric distance (e.g. Hamming distance), not the distance between coordinates (which is measured
   * in Pixels)!
   * @param masks Set of masks. Each masks[i] specifies permissible matches between the input query
   * descriptors and stored train descriptors from the i-th image trainDescCollection[i].
   * @param compactResult Parameter used when the mask (or masks) is not empty. If compactResult is
   * false, the matches vector has the same size as queryDescriptors rows. If compactResult is true,
   * the matches vector does not contain matches for fully masked-out query descriptors.
   */
  radiusMatch(queryDescriptors: Mat, matches: DMatchVectorVector, maxDistance: float, masks?: MatVector, compactResult?: boolean): void

  /**
   * @brief Trains a descriptor matcher
   * 
   * Trains a descriptor matcher (for example, the flann index). In all methods to match, the method
   * train() is run every time before matching. Some descriptor matchers (for example, BruteForceMatcher)
   * have an empty implementation of this method. Other matchers really train their inner structures (for
   * example, FlannBasedMatcher trains flann::Index ).
   */
  train(): void

}

/**
 * @brief Wrapping class for feature detection using the FAST method. :
 */
export class FastFeatureDetector extends Feature2D {

  /**
   * 
   */
  constructor(threshold?: int, nonmaxSuppression?: boolean, type?: FastFeatureDetector_DetectorType)

  /**
   * 
   */
  getDefaultName(): string

  /**
   * 
   */
  getNonmaxSuppression(): boolean

  /**
   * 
   */
  getThreshold(): int

  /**
   * 
   */
  getType(): FastFeatureDetector_DetectorType

  /**
   * 
   */
  setNonmaxSuppression(f: boolean): void

  /**
   * 
   */
  setThreshold(threshold: int): void

  /**
   * 
   */
  setType(type: FastFeatureDetector_DetectorType): void

}

/**
 * @brief Abstract base class for 2D image feature detectors and descriptor extractors
 */
export class Feature2D extends EmClassHandle {

  /**
   * @brief Computes the descriptors for a set of keypoints detected in an image (first variant) or image set
   * (second variant).
   * 
   * @param image Image.
   * @param keypoints Input collection of keypoints. Keypoints for which a descriptor cannot be
   * computed are removed. Sometimes new keypoints can be added, for example: SIFT duplicates keypoint
   * with several dominant orientations (for each orientation).
   * @param descriptors Computed descriptors. In the second variant of the method descriptors[i] are
   * descriptors computed for a keypoints[i]. Row j is the keypoints (or keypoints[i]) is the
   * descriptor for keypoint j-th keypoint.
   */
  compute(image: Mat, keypoints: KeyPointVector, descriptors: Mat): void

  /**
   * @overload
   * 
   * @param images Image set.
   * @param keypoints Input collection of keypoints. Keypoints for which a descriptor cannot be
   * computed are removed. Sometimes new keypoints can be added, for example: SIFT duplicates keypoint
   * with several dominant orientations (for each orientation).
   * @param descriptors Computed descriptors. In the second variant of the method descriptors[i] are
   * descriptors computed for a keypoints[i]. Row j is the keypoints (or keypoints[i]) is the
   * descriptor for keypoint j-th keypoint.
   */
  compute(images: MatVector, keypoints: unknown, descriptors: MatVector): void

  /**
   * 
   */
  defaultNorm(): int

  /**
   * 
   */
  descriptorSize(): int

  /**
   * 
   */
  descriptorType(): int

  /**
   * @brief Detects keypoints in an image (first variant) or image set (second variant).
   * 
   * @param image Image.
   * @param keypoints The detected keypoints. In the second variant of the method keypoints[i] is a set
   * of keypoints detected in images[i] .
   * @param mask Mask specifying where to look for keypoints (optional). It must be a 8-bit integer
   * matrix with non-zero values in the region of interest.
   */
  detect(image: Mat, keypoints: KeyPointVector, mask?: Mat): void

  /**
   * @overload
   * @param images Image set.
   * @param keypoints The detected keypoints. In the second variant of the method keypoints[i] is a set
   * of keypoints detected in images[i] .
   * @param masks Masks for each input image specifying where to look for keypoints (optional).
   * masks[i] is a mask for images[i].
   */
  detect(images: MatVector, keypoints: unknown, masks?: MatVector): void

  /**
   * Detects keypoints and computes the descriptors
   */
  detectAndCompute(image: Mat, mask: Mat, keypoints: KeyPointVector, descriptors: Mat, useProvidedKeypoints?: boolean): void

  /**
   * 
   */
  empty(): boolean

  /**
   * 
   */
  getDefaultName(): string

}

/**
 * @brief Wrapping class for feature detection using the goodFeaturesToTrack function. :
 */
export class GFTTDetector extends Feature2D {

  /**
   * 
   */
  constructor(maxCorners?: int, qualityLevel?: double, minDistance?: double, blockSize?: int, useHarrisDetector?: boolean, k?: double)

  /**
   * 
   */
  constructor(maxCorners: int, qualityLevel: double, minDistance: double, blockSize: int, gradiantSize: int, useHarrisDetector?: boolean, k?: double)

  /**
   * 
   */
  getBlockSize(): int

  /**
   * 
   */
  getDefaultName(): string

  /**
   * 
   */
  getHarrisDetector(): boolean

  /**
   * 
   */
  getK(): double

  /**
   * 
   */
  getMaxFeatures(): int

  /**
   * 
   */
  getMinDistance(): double

  /**
   * 
   */
  getQualityLevel(): double

  /**
   * 
   */
  setBlockSize(blockSize: int): void

  /**
   * 
   */
  setHarrisDetector(val: boolean): void

  /**
   * 
   */
  setK(k: double): void

  /**
   * 
   */
  setMaxFeatures(maxFeatures: int): void

  /**
   * 
   */
  setMinDistance(minDistance: double): void

  /**
   * 
   */
  setQualityLevel(qlevel: double): void

}

/**
 * @brief Implementation of HOG (Histogram of Oriented Gradients) descriptor and object detector.
 * 
 * the HOG descriptor algorithm introduced by Navneet Dalal and Bill Triggs @cite Dalal2005 .
 * 
 * useful links:
 * 
 * https://hal.inria.fr/inria-00548512/document/
 * 
 * https://en.wikipedia.org/wiki/Histogram_of_oriented_gradients
 * 
 * https://software.intel.com/en-us/ipp-dev-reference-histogram-of-oriented-gradients-hog-descriptor
 * 
 * http://www.learnopencv.com/histogram-of-oriented-gradients
 * 
 * http://www.learnopencv.com/handwritten-digits-classification-an-opencv-c-python-tutorial
 */
export class HOGDescriptor extends EmClassHandle {

  winSize: SizeLike

  blockSize: SizeLike

  blockStride: SizeLike

  cellSize: SizeLike

  nbins: int

  derivAperture: int

  winSigma: double

  histogramNormType: HOGDescriptor_HistogramNormType

  L2HysThreshold: double

  gammaCorrection: boolean

  svmDetector: FloatVector|float[]

  nlevels: int

  signedGradient: boolean

  /**
   * @brief Creates the HOG descriptor and detector with default params.
   * 
   * aqual to HOGDescriptor(Size(64,128), Size(16,16), Size(8,8), Size(8,8), 9 )
   */
  constructor()

  /**
   * @overload
   * @param _winSize sets winSize with given value.
   * @param _blockSize sets blockSize with given value.
   * @param _blockStride sets blockStride with given value.
   * @param _cellSize sets cellSize with given value.
   * @param _nbins sets nbins with given value.
   * @param _derivAperture sets derivAperture with given value.
   * @param _winSigma sets winSigma with given value.
   * @param _histogramNormType sets histogramNormType with given value.
   * @param _L2HysThreshold sets L2HysThreshold with given value.
   * @param _gammaCorrection sets gammaCorrection with given value.
   * @param _nlevels sets nlevels with given value.
   * @param _signedGradient sets signedGradient with given value.
   */
  constructor(_winSize: SizeLike, _blockSize: SizeLike, _blockStride: SizeLike, _cellSize: SizeLike, _nbins: int, _derivAperture?: int, _winSigma?: double, _histogramNormType?: HOGDescriptor_HistogramNormType, _L2HysThreshold?: double, _gammaCorrection?: boolean, _nlevels?: int, _signedGradient?: boolean)

  /**
   * @overload
   * @param filename The file name containing HOGDescriptor properties and coefficients for the linear SVM classifier.
   */
  constructor(filename: string)

  /**
   * @brief Detects objects of different sizes in the input image. The detected objects are returned as a list
   * of rectangles.
   * @param img Matrix of the type CV_8U or CV_8UC3 containing an image where objects are detected.
   * @param foundLocations Vector of rectangles where each rectangle contains the detected object.
   * @param foundWeights Vector that will contain confidence values for each detected object.
   * @param hitThreshold Threshold for the distance between features and SVM classifying plane.
   * Usually it is 0 and should be specified in the detector coefficients (as the last free coefficient).
   * But if the free coefficient is omitted (which is allowed), you can specify it manually here.
   * @param winStride Window stride. It must be a multiple of block stride.
   * @param padding Padding
   * @param scale Coefficient of the detection window increase.
   * @param finalThreshold Final threshold
   * @param useMeanshiftGrouping indicates grouping algorithm
   */
  detectMultiScale(img: Mat, foundLocations: RectVector, foundWeights: DoubleVector|double[], hitThreshold?: double, winStride?: SizeLike, padding?: SizeLike, scale?: double, finalThreshold?: double, useMeanshiftGrouping?: boolean): void

  /**
   * @brief Returns coefficients of the classifier trained for people detection (for 48x96 windows).
   */
  getDaimlerPeopleDetector(): FloatVector|float[]

  /**
   * @brief Returns coefficients of the classifier trained for people detection (for 64x128 windows).
   */
  getDefaultPeopleDetector(): FloatVector|float[]

  /**
   * @brief loads HOGDescriptor parameters and coefficients for the linear SVM classifier from a file.
   * @param filename Path of the file to read.
   * @param objname The optional name of the node to read (if empty, the first top-level node will be used).
   */
  load(filename: string, objname?: string): boolean

  /**
   * @brief Sets coefficients for the linear SVM classifier.
   * @param svmdetector coefficients for the linear SVM classifier.
   */
  setSVMDetector(svmdetector: Mat): void

}

/**
 * @brief Class implementing the KAZE keypoint detector and descriptor extractor, described in @cite ABD12 .
 * 
 * @note AKAZE descriptor can only be used with KAZE or AKAZE keypoints .. [ABD12] KAZE Features. Pablo
 * F. Alcantarilla, Adrien Bartoli and Andrew J. Davison. In European Conference on Computer Vision
 * (ECCV), Fiorenze, Italy, October 2012.
 */
export class KAZE extends Feature2D {

  /**
   * @brief The KAZE constructor
   * 
   * @param extended Set to enable extraction of extended (128-byte) descriptor.
   * @param upright Set to enable use of upright descriptors (non rotation-invariant).
   * @param threshold Detector response threshold to accept point
   * @param nOctaves Maximum octave evolution of the image
   * @param nOctaveLayers Default number of sublevels per scale level
   * @param diffusivity Diffusivity type. DIFF_PM_G1, DIFF_PM_G2, DIFF_WEICKERT or
   * DIFF_CHARBONNIER
   */
  constructor(extended?: boolean, upright?: boolean, threshold?: float, nOctaves?: int, nOctaveLayers?: int, diffusivity?: KAZE_DiffusivityType)

  /**
   * 
   */
  getDefaultName(): string

  /**
   * 
   */
  getDiffusivity(): KAZE_DiffusivityType

  /**
   * 
   */
  getExtended(): boolean

  /**
   * 
   */
  getNOctaveLayers(): int

  /**
   * 
   */
  getNOctaves(): int

  /**
   * 
   */
  getThreshold(): double

  /**
   * 
   */
  getUpright(): boolean

  /**
   * 
   */
  setDiffusivity(diff: KAZE_DiffusivityType): void

  /**
   * 
   */
  setExtended(extended: boolean): void

  /**
   * 
   */
  setNOctaveLayers(octaveLayers: int): void

  /**
   * 
   */
  setNOctaves(octaves: int): void

  /**
   * 
   */
  setThreshold(threshold: double): void

  /**
   * 
   */
  setUpright(upright: boolean): void

}

/**
 * @brief Maximally stable extremal region extractor
 * 
 * The class encapsulates all the parameters of the %MSER extraction algorithm (see [wiki
 * article](http://en.wikipedia.org/wiki/Maximally_stable_extremal_regions)).
 * 
 * - there are two different implementation of %MSER: one for grey image, one for color image
 * 
 * - the grey image algorithm is taken from: @cite nister2008linear ;  the paper claims to be faster
 * than union-find method; it actually get 1.5~2m/s on my centrino L7200 1.2GHz laptop.
 * 
 * - the color image algorithm is taken from: @cite forssen2007maximally ; it should be much slower
 * than grey image method ( 3~4 times ); the chi_table.h file is taken directly from paper's source
 * code which is distributed under GPL.
 * 
 * - (Python) A complete example showing the use of the %MSER detector can be found at samples/python/mser.py
 */
export class MSER extends Feature2D {

  /**
   * @brief Full constructor for %MSER detector
   * 
   * @param _delta it compares \f$(size_{i}-size_{i-delta})/size_{i-delta}\f$
   * @param _min_area prune the area which smaller than minArea
   * @param _max_area prune the area which bigger than maxArea
   * @param _max_variation prune the area have similar size to its children
   * @param _min_diversity for color image, trace back to cut off mser with diversity less than min_diversity
   * @param _max_evolution  for color image, the evolution steps
   * @param _area_threshold for color image, the area threshold to cause re-initialize
   * @param _min_margin for color image, ignore too small margin
   * @param _edge_blur_size for color image, the aperture size for edge blur
   */
  constructor(_delta?: int, _min_area?: int, _max_area?: int, _max_variation?: double, _min_diversity?: double, _max_evolution?: int, _area_threshold?: double, _min_margin?: double, _edge_blur_size?: int)

  /**
   * @brief Detect %MSER regions
   * 
   * @param image input image (8UC1, 8UC3 or 8UC4, must be greater or equal than 3x3)
   * @param msers resulting list of point sets
   * @param bboxes resulting bounding boxes
   */
  detectRegions(image: Mat, msers: unknown, bboxes: RectVector): void

  /**
   * 
   */
  getDefaultName(): string

  /**
   * 
   */
  getDelta(): int

  /**
   * 
   */
  getMaxArea(): int

  /**
   * 
   */
  getMinArea(): int

  /**
   * 
   */
  getPass2Only(): boolean

  /**
   * 
   */
  setDelta(delta: int): void

  /**
   * 
   */
  setMaxArea(maxArea: int): void

  /**
   * 
   */
  setMinArea(minArea: int): void

  /**
   * 
   */
  setPass2Only(f: boolean): void

}

/**
 * @brief The resulting HDR image is calculated as weighted average of the exposures considering exposure
 * values and camera response.
 * 
 * For more information see @cite DM97 .
 */
export class MergeDebevec extends EmClassHandle {

  /**
   * @brief Creates MergeDebevec object
   */
  constructor()

  /**
   * 
   */
  process(src: MatVector, dst: Mat, times: Mat, response: Mat): void

  /**
   * 
   */
  process(src: MatVector, dst: Mat, times: Mat): void

}

/**
 * @brief The base class algorithms that can merge exposure sequence to a single image.
 */
export class MergeExposures extends EmClassHandle {

  /**
   * @brief Merges images.
   * 
   * @param src vector of input images
   * @param dst result image
   * @param times vector of exposure time values for each image
   * @param response 256x1 matrix with inverse camera response function for each pixel value, it should
   * have the same number of channels as images.
   */
  process(src: MatVector, dst: Mat, times: Mat, response: Mat): void

}

/**
 * @brief Pixels are weighted using contrast, saturation and well-exposedness measures, than images are
 * combined using laplacian pyramids.
 * 
 * The resulting image weight is constructed as weighted average of contrast, saturation and
 * well-exposedness measures.
 * 
 * The resulting image doesn't require tonemapping and can be converted to 8-bit image by multiplying
 * by 255, but it's recommended to apply gamma correction and/or linear tonemapping.
 * 
 * For more information see @cite MK07 .
 */
export class MergeMertens extends EmClassHandle {

  /**
   * @brief Creates MergeMertens object
   * 
   * @param contrast_weight contrast measure weight. See MergeMertens.
   * @param saturation_weight saturation measure weight
   * @param exposure_weight well-exposedness measure weight
   */
  constructor(contrast_weight?: float, saturation_weight?: float, exposure_weight?: float)

  /**
   * 
   */
  getContrastWeight(): float

  /**
   * 
   */
  getExposureWeight(): float

  /**
   * 
   */
  getSaturationWeight(): float

  /**
   * 
   */
  process(src: MatVector, dst: Mat, times: Mat, response: Mat): void

  /**
   * @brief Short version of process, that doesn't take extra arguments.
   * 
   * @param src vector of input images
   * @param dst result image
   */
  process(src: MatVector, dst: Mat): void

  /**
   * 
   */
  setContrastWeight(contrast_weiht: float): void

  /**
   * 
   */
  setExposureWeight(exposure_weight: float): void

  /**
   * 
   */
  setSaturationWeight(saturation_weight: float): void

}

/**
 * @brief The resulting HDR image is calculated as weighted average of the exposures considering exposure
 * values and camera response.
 * 
 * For more information see @cite RB99 .
 */
export class MergeRobertson extends EmClassHandle {

  /**
   * @brief Creates MergeRobertson object
   */
  constructor()

  /**
   * 
   */
  process(src: MatVector, dst: Mat, times: Mat, response: Mat): void

  /**
   * 
   */
  process(src: MatVector, dst: Mat, times: Mat): void

}

/**
 * @brief Class implementing the ORB (*oriented BRIEF*) keypoint detector and descriptor extractor
 * 
 * described in @cite RRKB11 . The algorithm uses FAST in pyramids to detect stable keypoints, selects
 * the strongest features using FAST or Harris response, finds their orientation using first-order
 * moments and computes the descriptors using BRIEF (where the coordinates of random point pairs (or
 * k-tuples) are rotated according to the measured orientation).
 */
export class ORB extends Feature2D {

  /**
   * @brief The ORB constructor
   * 
   * @param nfeatures The maximum number of features to retain.
   * @param scaleFactor Pyramid decimation ratio, greater than 1. scaleFactor==2 means the classical
   * pyramid, where each next level has 4x less pixels than the previous, but such a big scale factor
   * will degrade feature matching scores dramatically. On the other hand, too close to 1 scale factor
   * will mean that to cover certain scale range you will need more pyramid levels and so the speed
   * will suffer.
   * @param nlevels The number of pyramid levels. The smallest level will have linear size equal to
   * input_image_linear_size/pow(scaleFactor, nlevels - firstLevel).
   * @param edgeThreshold This is size of the border where the features are not detected. It should
   * roughly match the patchSize parameter.
   * @param firstLevel The level of pyramid to put source image to. Previous layers are filled
   * with upscaled source image.
   * @param WTA_K The number of points that produce each element of the oriented BRIEF descriptor. The
   * default value 2 means the BRIEF where we take a random point pair and compare their brightnesses,
   * so we get 0/1 response. Other possible values are 3 and 4. For example, 3 means that we take 3
   * random points (of course, those point coordinates are random, but they are generated from the
   * pre-defined seed, so each element of BRIEF descriptor is computed deterministically from the pixel
   * rectangle), find point of maximum brightness and output index of the winner (0, 1 or 2). Such
   * output will occupy 2 bits, and therefore it will need a special variant of Hamming distance,
   * denoted as NORM_HAMMING2 (2 bits per bin). When WTA_K=4, we take 4 random points to compute each
   * bin (that will also occupy 2 bits with possible values 0, 1, 2 or 3).
   * @param scoreType The default HARRIS_SCORE means that Harris algorithm is used to rank features
   * (the score is written to KeyPoint::score and is used to retain best nfeatures features);
   * FAST_SCORE is alternative value of the parameter that produces slightly less stable keypoints,
   * but it is a little faster to compute.
   * @param patchSize size of the patch used by the oriented BRIEF descriptor. Of course, on smaller
   * pyramid layers the perceived image area covered by a feature will be larger.
   * @param fastThreshold the fast threshold
   */
  constructor(nfeatures?: int, scaleFactor?: float, nlevels?: int, edgeThreshold?: int, firstLevel?: int, WTA_K?: int, scoreType?: ORB_ScoreType, patchSize?: int, fastThreshold?: int)

  /**
   * 
   */
  getDefaultName(): string

  /**
   * 
   */
  getFastThreshold(): int

  /**
   * 
   */
  setEdgeThreshold(edgeThreshold: int): void

  /**
   * 
   */
  setFirstLevel(firstLevel: int): void

  /**
   * 
   */
  setMaxFeatures(maxFeatures: int): void

  /**
   * 
   */
  setNLevels(nlevels: int): void

  /**
   * 
   */
  setPatchSize(patchSize: int): void

  /**
   * 
   */
  setScaleFactor(scaleFactor: double): void

  /**
   * 
   */
  setScoreType(scoreType: ORB_ScoreType): void

  /**
   * 
   */
  setWTA_K(wta_k: int): void

}

/**
 * @brief Base class for tonemapping algorithms - tools that are used to map HDR image to 8-bit range.
 */
export class Tonemap extends EmClassHandle {

  /**
   * 
   */
  getGamma(): float

  /**
   * @brief Tonemaps image
   * 
   * @param src source image - CV_32FC3 Mat (float 32 bits 3 channels)
   * @param dst destination image - CV_32FC3 Mat with values in [0, 1] range
   */
  process(src: Mat, dst: Mat): void

  /**
   * 
   */
  setGamma(gamma: float): void

}

/**
 * @brief Adaptive logarithmic mapping is a fast global tonemapping algorithm that scales the image in
 * logarithmic domain.
 * 
 * Since it's a global operator the same function is applied to all the pixels, it is controlled by the
 * bias parameter.
 * 
 * Optional saturation enhancement is possible as described in @cite FL02 .
 * 
 * For more information see @cite DM03 .
 */
export class TonemapDrago extends EmClassHandle {

  /**
   * @brief Creates TonemapDrago object
   * 
   * @param gamma gamma value for gamma correction. See createTonemap
   * @param saturation positive saturation enhancement value. 1.0 preserves saturation, values greater
   * than 1 increase saturation and values less than 1 decrease it.
   * @param bias value for bias function in [0, 1] range. Values from 0.7 to 0.9 usually give best
   * results, default value is 0.85.
   */
  constructor(gamma?: float, saturation?: float, bias?: float)

  /**
   * 
   */
  getBias(): float

  /**
   * 
   */
  getSaturation(): float

  /**
   * 
   */
  setBias(bias: float): void

  /**
   * 
   */
  setSaturation(saturation: float): void

}

/**
 * @brief This algorithm transforms image to contrast using gradients on all levels of gaussian pyramid,
 * transforms contrast values to HVS response and scales the response. After this the image is
 * reconstructed from new contrast values.
 * 
 * For more information see @cite MM06 .
 */
export class TonemapMantiuk extends EmClassHandle {

  /**
   * @brief Creates TonemapMantiuk object
   * 
   * @param gamma gamma value for gamma correction. See createTonemap
   * @param scale contrast scale factor. HVS response is multiplied by this parameter, thus compressing
   * dynamic range. Values from 0.6 to 0.9 produce best results.
   * @param saturation saturation enhancement value. See createTonemapDrago
   */
  constructor(gamma?: float, scale?: float, saturation?: float)

  /**
   * 
   */
  getSaturation(): float

  /**
   * 
   */
  getScale(): float

  /**
   * 
   */
  setSaturation(saturation: float): void

  /**
   * 
   */
  setScale(scale: float): void

}

/**
 * @brief This is a global tonemapping operator that models human visual system.
 * 
 * Mapping function is controlled by adaptation parameter, that is computed using light adaptation and
 * color adaptation.
 * 
 * For more information see @cite RD05 .
 */
export class TonemapReinhard extends EmClassHandle {

  /**
   * @brief Creates TonemapReinhard object
   * 
   * @param gamma gamma value for gamma correction. See createTonemap
   * @param intensity result intensity in [-8, 8] range. Greater intensity produces brighter results.
   * @param light_adapt light adaptation in [0, 1] range. If 1 adaptation is based only on pixel
   * value, if 0 it's global, otherwise it's a weighted mean of this two cases.
   * @param color_adapt chromatic adaptation in [0, 1] range. If 1 channels are treated independently,
   * if 0 adaptation level is the same for each channel.
   */
  constructor(gamma?: float, intensity?: float, light_adapt?: float, color_adapt?: float)

  /**
   * 
   */
  getColorAdaptation(): float

  /**
   * 
   */
  getIntensity(): float

  /**
   * 
   */
  getLightAdaptation(): float

  /**
   * 
   */
  setColorAdaptation(color_adapt: float): void

  /**
   * 
   */
  setIntensity(intensity: float): void

  /**
   * 
   */
  setLightAdaptation(light_adapt: float): void

}

/**
 * @brief This class allows to create and manipulate comprehensive artificial neural networks.
 *      *
 *      * Neural network is presented as directed acyclic graph (DAG), where vertices are Layer instances,
 *      * and edges specify relationships between layers inputs and outputs.
 *      *
 *      * Each network layer has unique integer id and unique string name inside its network.
 *      * LayerId can store either layer name or layer id.
 *      *
 *      * This class supports reference counting of its instances, i. e. copies point to the same instance.
 */
export class dnn_Net extends EmClassHandle {

  /**
   * @brief Runs forward pass to compute output of layer with name @p outputName.
   * @param outputName name for layer which output is needed to get
   * @return blob for first output of specified layer.
   * @details By default runs forward pass for the whole network.
   */
  forward(outputName?: string): Mat

  /**
   * @brief Runs forward pass to compute output of layer with name @p outputName.
   * @param outputBlobs contains all output blobs for specified layer.
   * @param outputName name for layer which output is needed to get
   * @details If @p outputName is empty, runs forward pass for the whole network.
   */
  forward(outputBlobs: MatVector, outputName?: string): void

  /**
   * @brief Runs forward pass to compute outputs of layers listed in @p outBlobNames.
   * @param outputBlobs contains blobs for first outputs of specified layers.
   * @param outBlobNames names for layers which outputs are needed to get
   */
  forward(outputBlobs: MatVector, outBlobNames: unknown): void

  /**
   * @brief Sets the new input value for the network
   * @param blob        A new blob. Should have CV_32F or CV_8U depth.
   * @param name        A name of input layer.
   * @param scalefactor An optional normalization scale.
   * @param mean        An optional mean subtraction values.
   * @see connect(String, String) to know format of the descriptor.
   * 
   * If scale or mean values are specified, a final input blob is computed
   * as:
   * \f[input(n,c,h,w) = scalefactor \times (blob(n,c,h,w) - mean_c)\f]
   */
  setInput(blob: Mat, name?: string, scalefactor?: double, mean?: ScalarLike): void

}

/**
 * @brief Intelligent Scissors image segmentation
 *  *
 *  * This class is used to find the path (contour) between two points
 *  * which can be used for image segmentation.
 *  *
 *  * Usage example:
 *  * @snippet snippets/imgproc_segmentation.cpp usage_example_intelligent_scissors
 *  *
 *  * Reference: <a href="http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.138.3811&rep=rep1&type=pdf">"Intelligent Scissors for Image Composition"</a>
 *  * algorithm designed by Eric N. Mortensen and William A. Barrett, Brigham Young University
 *  * @cite Mortensen95intelligentscissors
 */
export class IntelligentScissorsMB extends EmClassHandle {

  /**
   * 
   */
  constructor()

  /**
   * @brief Specify input image and extract image features
   * 
   * @param image input image. Type is #CV_8UC1 / #CV_8UC3
   */
  applyImage(image: Mat): IntelligentScissorsMB

  /**
   * @brief Specify custom features of imput image
   * 
   * Customized advanced variant of applyImage() call.
   * 
   * @param non_edge Specify cost of non-edge pixels. Type is CV_8UC1. Expected values are `{0, 1}`.
   * @param gradient_direction Specify gradient direction feature. Type is CV_32FC2. Values are expected to be normalized: `x^2 + y^2 == 1`
   * @param gradient_magnitude Specify cost of gradient magnitude function: Type is CV_32FC1. Values should be in range `[0, 1]`.
   * @param image **Optional parameter**. Must be specified if subset of features is specified (non-specified features are calculated internally)
   */
  applyImageFeatures(non_edge: Mat, gradient_direction: Mat, gradient_magnitude: Mat, image?: Mat): IntelligentScissorsMB

  /**
   * @brief Prepares a map of optimal paths for the given source point on the image
   * 
   * @note applyImage() / applyImageFeatures() must be called before this call
   * 
   * @param sourcePt The source point used to find the paths
   */
  buildMap(sourcePt: PointLike): void

  /**
   * @brief Extracts optimal contour for the given target point on the image
   * 
   * @note buildMap() must be called before this call
   * 
   * @param targetPt The target point
   * @param[out] contour The list of pixels which contains optimal path between the source and the target points of the image. Type is CV_32SC2 (compatible with `std::vector<Point>`)
   * @param backward Flag to indicate reverse order of retrived pixels (use "true" value to fetch points from the target to the source point)
   */
  getContour(targetPt: PointLike, contour: Mat, backward?: boolean): void

  /**
   * @brief Switch edge feature extractor to use Canny edge detector
   * 
   * @note "Laplacian Zero-Crossing" feature extractor is used by default (following to original article)
   * 
   * @sa Canny
   */
  setEdgeFeatureCannyParameters(threshold1: double, threshold2: double, apertureSize?: int, L2gradient?: boolean): IntelligentScissorsMB

  /**
   * @brief Switch to "Laplacian Zero-Crossing" edge feature extractor and specify its parameters
   * 
   * This feature extractor is used by default according to article.
   * 
   * Implementation has additional filtering for regions with low-amplitude noise.
   * This filtering is enabled through parameter of minimal gradient amplitude (use some small value 4, 8, 16).
   * 
   * @note Current implementation of this feature extractor is based on processing of grayscale images (color image is converted to grayscale image first).
   * 
   * @note Canny edge detector is a bit slower, but provides better results (especially on color images): use setEdgeFeatureCannyParameters().
   * 
   * @param gradient_magnitude_min_value Minimal gradient magnitude value for edge pixels (default: 0, check is disabled)
   */
  setEdgeFeatureZeroCrossingParameters(gradient_magnitude_min_value?: float): IntelligentScissorsMB

  /**
   * @brief Specify gradient magnitude max value threshold
   * 
   * Zero limit value is used to disable gradient magnitude thresholding (default behavior, as described in original article).
   * Otherwize pixels with `gradient magnitude >= threshold` have zero cost.
   * 
   * @note Thresholding should be used for images with irregular regions (to avoid stuck on parameters from high-contract areas, like embedded logos).
   * 
   * @param gradient_magnitude_threshold_max Specify gradient magnitude max value threshold (default: 0, disabled)
   */
  setGradientMagnitudeMaxLimit(gradient_magnitude_threshold_max?: float): IntelligentScissorsMB

  /**
   * @brief Specify weights of feature functions
   * 
   * Consider keeping weights normalized (sum of weights equals to 1.0)
   * Discrete dynamic programming (DP) goal is minimization of costs between pixels.
   * 
   * @param weight_non_edge Specify cost of non-edge pixels (default: 0.43f)
   * @param weight_gradient_direction Specify cost of gradient direction function (default: 0.43f)
   * @param weight_gradient_magnitude Specify cost of gradient magnitude function (default: 0.14f)
   */
  setWeights(weight_non_edge: float, weight_gradient_direction: float, weight_gradient_magnitude: float): IntelligentScissorsMB

}
