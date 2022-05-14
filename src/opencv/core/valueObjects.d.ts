import { double, float, int } from './_types'

// emscripten::value_object<cv::Range>("Range")
//     .field("start", &cv::Range::start)
//     .field("end", &cv::Range::end);
export interface RangeLike {
  start: int
  end: int
}

export class Range implements RangeLike {
  start: int
  end: int
  constructor(start?: int, end?: int)
}

// emscripten::value_object<cv::TermCriteria>("TermCriteria")
//     .field("type", &cv::TermCriteria::type)
//     .field("maxCount", &cv::TermCriteria::maxCount)
//     .field("epsilon", &cv::TermCriteria::epsilon);
export interface TermCriteriaLike {
  type: int
  maxCount: int
  epsilon: double
}

export class TermCriteria implements TermCriteriaLike {
  type: int
  maxCount: int
  epsilon: double
  constructor(type?: int, maxCount?: int, epsilon?: double)
}


// #define EMSCRIPTEN_CV_SIZE(type) \
//     emscripten::value_object<type>("#type") \
//         .field("width", &type::width) \
//         .field("height", &type::height);

//     EMSCRIPTEN_CV_SIZE(Size)
//     EMSCRIPTEN_CV_SIZE(Size2f)
export interface SizeLike {
  width: number
  height: number
}

export type Size2fLike = SizeLike

export class Size implements SizeLike {
  width: number
  height: number
  constructor(width?: number, height?: number)
}


// #define EMSCRIPTEN_CV_POINT(type) \
//     emscripten::value_object<type>("#type") \
//         .field("x", &type::x) \
//         .field("y", &type::y); \

//     EMSCRIPTEN_CV_POINT(Point)
//     EMSCRIPTEN_CV_POINT(Point2f)

export interface PointLike {
  readonly x: number
  readonly y: number
}

export type Point2fLike = PointLike

export class Point implements PointLike {
  readonly x: number
  readonly y: number
  constructor(x?: number, y?: number)
}

// #define EMSCRIPTEN_CV_RECT(type, name) \
//     emscripten::value_object<cv::Rect_<type>> (name) \
//         .field("x", &cv::Rect_<type>::x) \
//         .field("y", &cv::Rect_<type>::y) \
//         .field("width", &cv::Rect_<type>::width) \
//         .field("height", &cv::Rect_<type>::height);

//     EMSCRIPTEN_CV_RECT(int, "Rect")
//     EMSCRIPTEN_CV_RECT(float, "Rect2f")
export interface RectLike {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export type Rect2fLike = RectLike

export class Rect implements RectLike {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  constructor(x?: number, y?: number, width?: number, height?: number)
  // TODO: where do these constructors come from?
  constructor()
  constructor(point: PointLike, size: SizeLike)
  constructor(rect: RectLike)
}

// emscripten::value_object<cv::RotatedRect>("RotatedRect")
//     .field("center", &cv::RotatedRect::center)
//     .field("size", &cv::RotatedRect::size)
//     .field("angle", &cv::RotatedRect::angle);
export interface RotatedRectLike {
  center: Point2fLike
  size: Size2fLike
  angle: float
}

export class RotatedRect implements RotatedRectLike {
  center: Point2fLike
  size: Size2fLike
  angle: float
  constructor(center?: Point2fLike, size?: Size2fLike, angle?: float)
  // TODO: where from?
  static points(r: RotatedRectLike): PointLike[]
  static boundingRect2f(r: RotatedRectLike): PointLike
}

// function("rotatedRectPoints", select_overload<emscripten::val(const cv::RotatedRect&)>(&binding_utils::rotatedRectPoints));
export function rotatedRectPoints(r: RotatedRectLike): [Point2fLike, Point2fLike, Point2fLike, Point2fLike]
// function("rotatedRectBoundingRect", select_overload<Rect(const cv::RotatedRect&)>(&binding_utils::rotatedRectBoundingRect));
export function rotatedRectBoundingRect(r: RotatedRectLike): RectLike
// function("rotatedRectBoundingRect2f", select_overload<Rect2f(const cv::RotatedRect&)>(&binding_utils::rotatedRectBoundingRect2f));
export function rotatedRectBoundingRect2f(r: RotatedRectLike): Rect2fLike

// emscripten::value_object<cv::KeyPoint>("KeyPoint")
//     .field("angle", &cv::KeyPoint::angle)
//     .field("class_id", &cv::KeyPoint::class_id)
//     .field("octave", &cv::KeyPoint::octave)
//     .field("pt", &cv::KeyPoint::pt)
//     .field("response", &cv::KeyPoint::response)
//     .field("size", &cv::KeyPoint::size);
export interface KeyPointLike {
  angle: float
  class_id: int
  octave: int
  pt: Point2fLike
  response: float
  size: int
}

// emscripten::value_object<cv::DMatch>("DMatch")
//     .field("queryIdx", &cv::DMatch::queryIdx)
//     .field("trainIdx", &cv::DMatch::trainIdx)
//     .field("imgIdx", &cv::DMatch::imgIdx)
//     .field("distance", &cv::DMatch::distance);
export interface DMatchLike {
  queryIdx: int
  trainIdx: int
  imgIdx: int
  distance: float
}


// emscripten::value_array<cv::Scalar_<double>> ("Scalar")
//     .element(emscripten::index<0>())
//     .element(emscripten::index<1>())
//     .element(emscripten::index<2>())
//     .element(emscripten::index<3>());
export class Scalar {
  [index: number]: double
  constructor(v0?: double, v1?: double, v2?: double, v3?: double)
}

// `double[]` is here for practicality, as typescript assumes types of literal arrays to be a generic one
export type ScalarLike = [double, double, double, double] | double[] | Scalar


// emscripten::value_object<binding_utils::MinMaxLoc>("MinMaxLoc")
//     .field("minVal", &binding_utils::MinMaxLoc::minVal)
//     .field("maxVal", &binding_utils::MinMaxLoc::maxVal)
//     .field("minLoc", &binding_utils::MinMaxLoc::minLoc)
//     .field("maxLoc", &binding_utils::MinMaxLoc::maxLoc);
export interface MinMaxLocLike {
  minVal: double
  maxVal: double
  minLoc: PointLike
  maxLoc: PointLike
}

export class MinMaxLoc implements MinMaxLocLike {
  minVal: double
  maxVal: double
  minLoc: PointLike
  maxLoc: PointLike
  constructor(minVal?: double, maxVal?: double, minLoc?: PointLike, maxLoc?: PointLike)
}


// emscripten::value_object<binding_utils::Circle>("Circle")
//     .field("center", &binding_utils::Circle::center)
//     .field("radius", &binding_utils::Circle::radius);
export interface CircleLike {
  center: Point2fLike
  radius: float
}

export class Circle implements CircleLike {
  center: Point2fLike
  radius: float
  constructor(center?: Point2fLike, radius?: float)
}


// emscripten::value_object<cv::Moments >("Moments")
export interface MomentsLike {
  m00: double
  m10: double
  m01: double
  m20: double
  m11: double
  m02: double
  m30: double
  m21: double
  m12: double
  m03: double
  mu20: double
  mu11: double
  mu02: double
  mu30: double
  mu21: double
  mu12: double
  mu03: double
  nu20: double
  nu11: double
  nu02: double
  nu30: double
  nu21: double
  nu12: double
  nu03: double
}

// emscripten::value_object<cv::Exception>("Exception")
//     .field("code", &cv::Exception::code)
//     .field("msg", &binding_utils::getExceptionMsg, &binding_utils::setExceptionMsg);
export interface ExceptionLike {
  code: int
  msg: string
}

export function exceptionFromPtr(ptr: number): ExceptionLike