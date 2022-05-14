import { EmVector } from '../emscripten/emscripten'
import { Mat } from './Mat'
import { DMatchLike, KeyPointLike, PointLike, RectLike } from './valueObjects'
import { double, float, int } from './_types'

// register_vector<int>("IntVector");
export class IntVector extends EmVector<int> { }

// register_vector<float>("FloatVector");
export class FloatVector extends EmVector<float> { }

// register_vector<double>("DoubleVector");
export class DoubleVector extends EmVector<double> { }

// register_vector<cv::Point>("PointVector");
export class PointVector extends EmVector<PointLike> { }

// register_vector<cv::Mat>("MatVector");
export class MatVector extends EmVector<Mat> { }

// register_vector<cv::Rect>("RectVector");
export class RectVector extends EmVector<RectLike> { }

// register_vector<cv::KeyPoint>("KeyPointVector");
export class KeyPointVector extends EmVector<KeyPointLike> { }

// register_vector<cv::DMatch>("DMatchVector");
export class DMatchVector extends EmVector<DMatchLike> { }

// register_vector<std::vector<cv::DMatch>>("DMatchVectorVector");
export class DMatchVectorVector extends EmVector<DMatchVector> { }
