declare module HalInterface {
    enum DataTypes {
        CV_8U = 0,
        CV_8S = 1,
        CV_16U = 2,
        CV_16S = 3,
        CV_32S = 4,
        CV_32F = 5,
        CV_64F = 6,
        CV_16F = 7,
        CV_8UC1 = 0,
        CV_8UC2 = 8,
        CV_8UC3 = 16,
        CV_8UC4 = 24,
        CV_8SC1 = 1,
        CV_8SC2 = 9,
        CV_8SC3 = 17,
        CV_8SC4 = 25,
        CV_16UC1 = 2,
        CV_16UC2 = 10,
        CV_16UC3 = 18,
        CV_16UC4 = 26,
        CV_16SC1 = 3,
        CV_16SC2 = 11,
        CV_16SC3 = 19,
        CV_16SC4 = 27,
        CV_32SC1 = 4,
        CV_32SC2 = 12,
        CV_32SC3 = 20,
        CV_32SC4 = 28,
        CV_32FC1 = 5,
        CV_32FC2 = 13,
        CV_32FC3 = 21,
        CV_32FC4 = 29,
        CV_64FC1 = 6,
        CV_64FC2 = 14,
        CV_64FC3 = 22,
        CV_64FC4 = 30,
        CV_16FC1 = 7,
        CV_16FC2 = 15,
        CV_16FC3 = 23,
        CV_16FC4 = 31,
    }

    interface _DataTypes {
        CV_8U: DataTypes.CV_8U;
        CV_8S: DataTypes.CV_8S;
        CV_16U: DataTypes.CV_16U;
        CV_16S: DataTypes.CV_16S;
        CV_32S: DataTypes.CV_32S;
        CV_32F: DataTypes.CV_32F;
        CV_64F: DataTypes.CV_64F;
        CV_16F: DataTypes.CV_16F;
        CV_8UC1: DataTypes.CV_8UC1;
        CV_8UC2: DataTypes.CV_8UC2;
        CV_8UC3: DataTypes.CV_8UC3;
        CV_8UC4: DataTypes.CV_8UC4;
        CV_8SC1: DataTypes.CV_8SC1;
        CV_8SC2: DataTypes.CV_8SC2;
        CV_8SC3: DataTypes.CV_8SC3;
        CV_8SC4: DataTypes.CV_8SC4;
        CV_16UC1: DataTypes.CV_16UC1;
        CV_16UC2: DataTypes.CV_16UC2;
        CV_16UC3: DataTypes.CV_16UC3;
        CV_16UC4: DataTypes.CV_16UC4;
        CV_16SC1: DataTypes.CV_16SC1;
        CV_16SC2: DataTypes.CV_16SC2;
        CV_16SC3: DataTypes.CV_16SC3;
        CV_16SC4: DataTypes.CV_16SC4;
        CV_32SC1: DataTypes.CV_32SC1;
        CV_32SC2: DataTypes.CV_32SC2;
        CV_32SC3: DataTypes.CV_32SC3;
        CV_32SC4: DataTypes.CV_32SC4;
        CV_32FC1: DataTypes.CV_32FC1;
        CV_32FC2: DataTypes.CV_32FC2;
        CV_32FC3: DataTypes.CV_32FC3;
        CV_32FC4: DataTypes.CV_32FC4;
        CV_64FC1: DataTypes.CV_64FC1;
        CV_64FC2: DataTypes.CV_64FC2;
        CV_64FC3: DataTypes.CV_64FC3;
        CV_64FC4: DataTypes.CV_64FC4;
        CV_16FC1: DataTypes.CV_16FC1;
        CV_16FC2: DataTypes.CV_16FC2;
        CV_16FC3: DataTypes.CV_16FC3;
        CV_16FC4: DataTypes.CV_16FC4;
    }
}
export = HalInterface;
