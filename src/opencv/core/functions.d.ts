import { int } from './_types'
import { Mat } from './Mat'
import { CircleLike, MinMaxLocLike, PointLike, RectLike, ScalarLike } from './valueObjects'

// function("minEnclosingCircle", select_overload<binding_utils::Circle(const cv::Mat&)>(&binding_utils::minEnclosingCircle));
export function minEnclosingCircle(mat: Mat): CircleLike

// function("floodFill", select_overload<int(cv::Mat&, cv::Mat&, Point, Scalar, emscripten::val, Scalar, Scalar, int)>(&binding_utils::floodFill_wrapper));
export function floodFill(image: Mat, mask: Mat, seedPoint: PointLike, newVal: ScalarLike, rect: RectLike, loDiff?: ScalarLike, upDiff?: ScalarLike, flags?: int): int

// function("minMaxLoc", select_overload<binding_utils::MinMaxLoc(const cv::Mat&)>(&binding_utils::minMaxLoc_1));
// function("minMaxLoc", select_overload<binding_utils::MinMaxLoc(const cv::Mat&, const cv::Mat&)>(&binding_utils::minMaxLoc));
export function minMaxLoc(src: Mat, mask?: Mat): MinMaxLocLike

//  function("CV_MAT_DEPTH", &binding_utils::cvMatDepth);
export function CV_MAT_DEPTH(flags: int): int

// function("getBuildInformation", &binding_utils::getBuildInformation);
export function getBuildInformation(): string
